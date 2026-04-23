import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { In, Repository } from 'typeorm';
import { Role } from '@authentication/enums/role.enum';
import { RoleDomains } from '@authentication/utils/resolve-email.util';
import { EmailLabel } from '@email/enums/email-label.enum';
import { MessageStatus } from '@email/enums/message-status.enum';
import { Message } from '@email/entities/message.entity';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { MessageLabelsService } from '@email/services/message-labels.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { IngestedMessageEvent } from './gmail-rabbit-publisher.service';

export type LabelChangeEvent = {
  gmailMessageId: string;
  addLabelIds: string[];
  removeLabelIds: string[];
};

@Injectable()
export class GmailChangeSyncService {
  private readonly logger = new Logger(GmailChangeSyncService.name);

  constructor(
    private readonly messageLabelsService: MessageLabelsService,
    private readonly settingService: SettingService,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async markIgnoredByGmailMessageIds(gmailMessageIds: string[]): Promise<number> {
    const uniqueIds = [...new Set(gmailMessageIds.filter(Boolean))];
    if (uniqueIds.length === 0) {
      return 0;
    }

    // Only downgrade "opened" -> "ignored" (keep replied as-is)
    const result = await this.messageRepository.update(
      { gmailMessageId: In(uniqueIds), status: MessageStatus.Opened },
      { status: MessageStatus.Ignored },
    );
    return result.affected ?? 0;
  }

  async applyHistoryChanges(
    gmail: gmail_v1.Gmail,
    messageIds: string[],
    labelChanges: LabelChangeEvent[],
  ): Promise<{ ingestedIds: number[]; ingestedEvents: IngestedMessageEvent[] }> {
    const { ingestedIds, ingestedEvents } = await this.ingestMessageIds(gmail, messageIds);
    await this.syncSystemLabelChanges(labelChanges);
    return { ingestedIds, ingestedEvents };
  }

  async ingestNewMessages(
    gmail: gmail_v1.Gmail,
    messageIds: string[],
  ): Promise<{ ingestedIds: number[]; ingestedEvents: IngestedMessageEvent[] }> {
    return await this.ingestMessageIds(gmail, messageIds);
  }

  private async ingestMessageIds(
    gmail: gmail_v1.Gmail,
    messageIds: string[],
  ): Promise<{ ingestedIds: number[]; ingestedEvents: IngestedMessageEvent[] }> {
    const superEmail = await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail);
    throwUnless(superEmail?.email, new Error('Super email is not configured'));

    const ingestedIds: number[] = [];
    const ingestedEvents: IngestedMessageEvent[] = [];
    for (const messageId of [...new Set(messageIds.filter(Boolean))]) {
      try {
        const result = await this.processIncomingMessage(gmail, messageId, superEmail.email);
        if (!result) {
          continue;
        }

        ingestedIds.push(result.messageId);
        ingestedEvents.push(result);
      } catch (error) {
        this.logger.warn(`Skip message ${messageId}`, error instanceof Error ? error.stack : String(error));
      }
    }

    return { ingestedIds, ingestedEvents };
  }

  private async processIncomingMessage(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    superEmail: string,
  ): Promise<IngestedMessageEvent | null> {
    const exists = await this.messageRepository.findOne({ where: { gmailMessageId } });
    if (exists) {
      return null;
    }

    const { data: gmailMessage } = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId,
      format: 'full',
    });
    const parsedMessage = parseMessage(gmailMessage);
    const senderEmail = parsedMessage.headers.from?.match(/<(.+)>/)?.[1] ?? parsedMessage.headers.from;
    if (!(await this.isStudentSender(senderEmail))) {
      return null;
    }

    const htmlContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const plainTextContent = htmlToText(htmlContent, { wordwrap: false });
    const message = await this.messageRepository.save({
      gmailMessageId,
      headerMessageId: parsedMessage.headers['message-id'],
      threadId: gmailMessage.threadId,
      subject: parsedMessage.headers.subject,
      labelIds: gmailMessage.labelIds ?? [],
      sentAt: parsedMessage.headers.date ? new Date(parsedMessage.headers.date) : undefined,
      senderEmail,
      senderName: parsedMessage.headers.from,
      superEmail,
      content: htmlContent,
    });

    return {
      messageId: message.id,
      subject: message.subject,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      content: plainTextContent,
    };
  }

  private async syncSystemLabelChanges(changes: LabelChangeEvent[]): Promise<void> {
    if (changes.length === 0) {
      return;
    }

    const trackedLabelIds = await this.getTrackedLabelIds();
    const mergedChanges = new Map<
      string,
      {
        addLabelIds: Set<string>;
        removeLabelIds: Set<string>;
        addSystemLabels: Set<EmailLabel>;
        removeSystemLabels: Set<EmailLabel>;
      }
    >();

    for (const change of changes) {
      const entry = mergedChanges.get(change.gmailMessageId) ?? {
        addLabelIds: new Set<string>(),
        removeLabelIds: new Set<string>(),
        addSystemLabels: new Set<EmailLabel>(),
        removeSystemLabels: new Set<EmailLabel>(),
      };

      for (const labelId of change.addLabelIds) {
        entry.addLabelIds.add(labelId);
        entry.removeLabelIds.delete(labelId);
        const systemLabel = trackedLabelIds.get(labelId);
        if (systemLabel) {
          entry.addSystemLabels.add(systemLabel);
          entry.removeSystemLabels.delete(systemLabel);
        }
      }

      for (const labelId of change.removeLabelIds) {
        entry.removeLabelIds.add(labelId);
        entry.addLabelIds.delete(labelId);
        const systemLabel = trackedLabelIds.get(labelId);
        if (systemLabel) {
          entry.removeSystemLabels.add(systemLabel);
          entry.addSystemLabels.delete(systemLabel);
        }
      }

      mergedChanges.set(change.gmailMessageId, entry);
    }

    const gmailMessageIds = [...mergedChanges.keys()];
    const messages = await this.messageRepository.find({
      where: { gmailMessageId: In(gmailMessageIds) },
      select: ['id', 'gmailMessageId', 'systemLabels', 'labelIds'],
    });
    const messagesByGmailId = new Map(messages.map((message) => [message.gmailMessageId, message]));

    for (const gmailMessageId of gmailMessageIds) {
      const message = messagesByGmailId.get(gmailMessageId);
      const change = mergedChanges.get(gmailMessageId);
      if (!message || !change) {
        continue;
      }

      const nextSystemLabels = [...new Set([...(message.systemLabels ?? []), ...change.addSystemLabels])].filter(
        (label) => !change.removeSystemLabels.has(label),
      );
      const nextLabelIds = [...new Set([...(message.labelIds ?? []), ...change.addLabelIds])].filter(
        (labelId) => !change.removeLabelIds.has(labelId),
      );

      await this.messageLabelsService.syncFromGmail(message.id, nextSystemLabels, nextLabelIds);
    }
  }

  private async isStudentSender(senderEmail?: string): Promise<boolean> {
    if (!senderEmail) {
      return false;
    }

    const domain = senderEmail.toLowerCase().split('@')[1];
    if (!domain) {
      return false;
    }

    const emailDomainsByRole =
      (await this.settingService.get<RoleDomains>(SettingKey.AuthEmailDomains)) ?? ({} as RoleDomains);
    const allowedStudentDomains = emailDomainsByRole[Role.Student] ?? [];
    return allowedStudentDomains.includes(domain);
  }

  private async getTrackedLabelIds(): Promise<Map<string, EmailLabel>> {
    const configuredLabels = (await this.settingService.get<Record<EmailLabel, string>>(SettingKey.EmailLabels)) ?? {};
    const supportedSystemLabels: EmailLabel[] = [
      EmailLabel.ClassRegistration,
      EmailLabel.Training,
      EmailLabel.Graduation,
      EmailLabel.Pending,
    ];

    return new Map(
      supportedSystemLabels
        .map((label) => [configuredLabels[label], label] as const)
        .filter(([gmailLabelId]) => Boolean(gmailLabelId)),
    );
  }
}
