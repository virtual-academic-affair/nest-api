import { DomainsService } from '@authentication/services/domains.service';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as parseMessage from 'gmail-api-parse-message';
import { htmlToText } from 'html-to-text';
import { In, Repository } from 'typeorm';
import { Role } from '@authentication/decorators/roles.decorator';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/message-status.enum';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { GmailHistoryClientService } from '@email/services/gmail/gmail-history-client.service';
import { GmailMessageClientService } from '@email/services/gmail/gmail-message-client.service';
import {
  GmailRabbitPublisherService,
  IngestedMessageEvent,
} from '@email/services/gmail/gmail-rabbit-publisher.service';
import { GmailWebhookService, PubSubPushPayload } from '@email/services/gmail/gmail-webhook.service';
import { GmailLabelIdsService } from '@email/services/gmail-label-ids.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

type WebhookEvent = 'vaaLabelAdded' | 'vaaLabelRemoved';

@Injectable()
export class GmailWebhookHandlerService {
  private readonly logger = new Logger(GmailWebhookHandlerService.name);

  constructor(
    private readonly gmailWebhookService: GmailWebhookService,
    private readonly gmailHistoryClientService: GmailHistoryClientService,
    private readonly gmailMessageClientService: GmailMessageClientService,
    private readonly gmailRabbitPublisherService: GmailRabbitPublisherService,
    private readonly settingService: SettingService,
    private readonly gmailLabelIdsService: GmailLabelIdsService,
    private readonly emailDomainsService: DomainsService,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async handle(payload: PubSubPushPayload): Promise<void> {
    const pushData = this.gmailWebhookService.parsePayload(payload);
    if (!this.gmailWebhookService.isSvSender(pushData?.emailAddress)) {
      return;
    }

    const historyId = pushData?.historyId != null ? String(pushData.historyId) : null;
    if (!historyId) {
      return;
    }

    const previousHistoryId = await this.settingService.get<string>(SettingKey.EmailGmailHistoryId);
    if (!previousHistoryId) {
      await this.settingService.set(SettingKey.EmailGmailHistoryId, historyId);
      return;
    }

    const vaaLabelId = await this.gmailLabelIdsService.ensureParentId();
    const { addedMessageIds, removedMessageIds, latestHistoryId } = await this.gmailHistoryClientService.listLabelDelta(
      previousHistoryId,
      vaaLabelId,
    );

    await this.handleEvents('vaaLabelAdded', addedMessageIds, vaaLabelId);
    await this.handleEvents('vaaLabelRemoved', removedMessageIds, vaaLabelId);

    await this.settingService.set(SettingKey.EmailGmailHistoryId, latestHistoryId ?? historyId);
  }

  private async ingestMessages(messageIds: string[], vaaLabelId: string): Promise<IngestedMessageEvent[]> {
    const superEmail = await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail);
    if (!superEmail?.email) {
      throw new Error('Super email is not configured');
    }

    const studentDomains = await this.emailDomainsService.getDomains(Role.Student);
    const events: IngestedMessageEvent[] = [];

    for (const gmailMessageId of [...new Set(messageIds)]) {
      try {
        const event = await this.ingestOne(gmailMessageId, superEmail.email, studentDomains, vaaLabelId);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        this.logger.warn(`Skip message ${gmailMessageId}: ${toMessage(error)}`);
      }
    }

    return events;
  }

  private async ingestOne(
    gmailMessageId: string,
    superEmail: string,
    studentDomains: string[],
    vaaLabelId: string,
  ): Promise<IngestedMessageEvent | null> {
    if (await this.messageRepository.findOne({ where: { gmailMessageId } })) {
      return null;
    }

    const rawMessage = await this.gmailMessageClientService.getMessageById(gmailMessageId);
    const parsedMessage = parseMessage(rawMessage);
    const senderEmail = extractSenderEmail(parsedMessage.headers.from);
    if (!senderEmail || !isFromStudentDomain(senderEmail, studentDomains)) {
      return null;
    }

    const nextLabelIds = new Set(rawMessage.labelIds ?? []);
    if (!nextLabelIds.has(vaaLabelId)) {
      await this.gmailMessageClientService.addLabel(gmailMessageId, vaaLabelId);
      nextLabelIds.add(vaaLabelId);
    }

    const htmlContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const message = await this.messageRepository.save({
      gmailMessageId,
      headerMessageId: parsedMessage.headers['message-id'],
      threadId: rawMessage.threadId,
      subject: parsedMessage.headers.subject,
      labelIds: [...nextLabelIds],
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
      content: htmlToText(htmlContent, { wordwrap: false }),
    };
  }

  private async markIgnored(gmailMessageIds: string[]): Promise<void> {
    await this.messageRepository.update(
      { gmailMessageId: In(gmailMessageIds), status: MessageStatus.Opened },
      { status: MessageStatus.Ignored },
    );
  }

  private async handleEvents(event: WebhookEvent, gmailMessageIds: string[], vaaLabelId: string): Promise<void> {
    if (gmailMessageIds.length === 0) {
      return;
    }

    switch (event) {
      case 'vaaLabelAdded': {
        const ingestedEvents = await this.ingestMessages(gmailMessageIds, vaaLabelId);
        await this.gmailRabbitPublisherService.publishIngested(ingestedEvents);
        break;
      }
      case 'vaaLabelRemoved': {
        await this.markIgnored(gmailMessageIds);
        break;
      }
      default:
        break;
    }
  }
}

function extractSenderEmail(from?: string): string | undefined {
  return from?.match(/<(.+)>/)?.[1] ?? from;
}

function isFromStudentDomain(email: string, allowedDomains: string[]): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return !!domain && allowedDomains.includes(domain);
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
