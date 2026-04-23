import { Role } from '@authentication/enums/role.enum';
import { EmailDomainsService } from '@authentication/services/email-domains.service';
import { Message } from '@email/entities/message.entity';
import { EmailLabel } from '@email/enums/email-label.enum';
import { MessageStatus } from '@email/enums/message-status.enum';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { In, Repository } from 'typeorm';
import { GmailApiService } from '../gmail-api.service';
import { GmailLabelIdsService } from '../gmail-label-ids.service';
import { GmailRabbitPublisherService, IngestedMessageEvent } from './gmail-rabbit-publisher.service';

export function decodePushData(encoded?: string): { historyId?: string } | null {
  if (!encoded?.trim()) return null;
  try {
    return JSON.parse(Buffer.from(encoded.trim(), 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function extractSenderEmail(from?: string): string | undefined {
  return from?.match(/<(.+)>/)?.[1] ?? from;
}

export function isFromStudentDomain(email: string, allowedDomains: string[]): boolean {
  const domain = email.toLowerCase().split('@')[1];
  return !!domain && allowedDomains.includes(domain);
}

const GMAIL_USER_ID = 'me';
const WATCH_RENEW_INTERVAL_MS = 1000 * 60 * 60 * 24;

@Injectable()
export class GmailWebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GmailWebhookService.name);
  private renewWatchTimer?: NodeJS.Timeout;

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailRabbitPublisherService: GmailRabbitPublisherService,
    private readonly settingService: SettingService,
    private readonly gmailLabelIdsService: GmailLabelIdsService,
    private readonly emailDomainsService: EmailDomainsService,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  onModuleInit(): void {
    this.setupWatch().catch((err) => this.logger.warn(`Skip initial watch: ${toMessage(err)}`));
    this.renewWatchTimer = setInterval(
      () => this.setupWatch().catch((err) => this.logger.warn(`Skip watch renewal: ${toMessage(err)}`)),
      WATCH_RENEW_INTERVAL_MS,
    );
  }

  onModuleDestroy(): void {
    if (this.renewWatchTimer) clearInterval(this.renewWatchTimer);
  }

  async setupWatch(): Promise<void> {
    // 'projects/1234567890/topics/gmail-webhook'
    const topicName = process.env.GMAIL_WATCH_TOPIC_NAME?.trim() ?? null;

    const gmail = await this.gmailApiService.getGmailClient();
    const pendingLabelId = await this.gmailLabelIdsService.getId(EmailLabel.Pending);
    const labelIds = ['INBOX', pendingLabelId].filter(Boolean) as string[];

    const { data } = await gmail.users.watch({
      userId: GMAIL_USER_ID,
      requestBody: { topicName, labelIds, labelFilterAction: 'include' },
    });

    if (!data.historyId) {
      this.logger.warn('Watch registered but missing historyId');
      return;
    }

    this.logger.log(`Watch registered. historyId=${data.historyId}`);
    await this.settingService.set(SettingKey.EmailGmailHistoryId, data.historyId);
  }

  // ---------------------------------------------------------------------------
  // Webhook handler
  // ---------------------------------------------------------------------------

  async handleWebhook(payload: { message?: { data?: string } }): Promise<void> {
    const pushData = decodePushData(payload?.message?.data);
    if (!pushData?.historyId) return;

    const previousHistoryId = await this.settingService.get<string>(SettingKey.EmailGmailHistoryId);
    if (!previousHistoryId) {
      await this.settingService.set(SettingKey.EmailGmailHistoryId, pushData.historyId);
      return;
    }

    const gmail = await this.gmailApiService.getGmailClient();
    const pendingLabelId = await this.gmailLabelIdsService.getId(EmailLabel.Pending);
    const { newMessageIds, pendingRemovedIds, latestHistoryId } = await this.diffHistory(
      gmail,
      previousHistoryId,
      pendingLabelId,
    );

    // 1. Ingest new messages from student domains
    const ingestedEvents = await this.ingestMessages(gmail, newMessageIds);
    await this.gmailRabbitPublisherService.publishIngested(ingestedEvents);

    // 2. Mark ignored when "pending" label is removed
    if (pendingRemovedIds.length > 0) {
      await this.markIgnored(pendingRemovedIds);
    }

    await this.settingService.set(SettingKey.EmailGmailHistoryId, latestHistoryId ?? pushData.historyId);
  }

  // ---------------------------------------------------------------------------
  // Ingest
  // ---------------------------------------------------------------------------

  private async ingestMessages(gmail: gmail_v1.Gmail, messageIds: string[]): Promise<IngestedMessageEvent[]> {
    const superEmail = await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail);
    if (!superEmail?.email) throw new Error('Super email is not configured');

    const studentDomains = await this.getStudentDomains();
    const events: IngestedMessageEvent[] = [];

    for (const gmailMessageId of [...new Set(messageIds)]) {
      try {
        const event = await this.ingestOne(gmail, gmailMessageId, superEmail.email, studentDomains);
        if (event) events.push(event);
      } catch (err) {
        this.logger.warn(`Skip message ${gmailMessageId}: ${toMessage(err)}`);
      }
    }

    return events;
  }

  private async ingestOne(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    superEmail: string,
    studentDomains: string[],
  ): Promise<IngestedMessageEvent | null> {
    if (await this.messageRepository.findOne({ where: { gmailMessageId } })) return null;

    const { data: raw } = await gmail.users.messages.get({ userId: GMAIL_USER_ID, id: gmailMessageId, format: 'full' });
    const parsed = parseMessage(raw);

    const senderEmail = extractSenderEmail(parsed.headers.from);
    if (!senderEmail || !isFromStudentDomain(senderEmail, studentDomains)) return null;

    const htmlContent = parsed.textHtml ?? parsed.textPlain ?? '';
    const message = await this.messageRepository.save({
      gmailMessageId,
      headerMessageId: parsed.headers['message-id'],
      threadId: raw.threadId,
      subject: parsed.headers.subject,
      labelIds: raw.labelIds ?? [],
      sentAt: parsed.headers.date ? new Date(parsed.headers.date) : undefined,
      senderEmail,
      senderName: parsed.headers.from,
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

  // ---------------------------------------------------------------------------
  // History diff
  // ---------------------------------------------------------------------------

  private async diffHistory(
    gmail: gmail_v1.Gmail,
    startHistoryId: string,
    pendingLabelId?: string | null,
  ): Promise<{ newMessageIds: string[]; pendingRemovedIds: string[]; latestHistoryId?: string }> {
    const newMessageIds = new Set<string>();
    const pendingRemovedIds = new Set<string>();
    let pageToken: string | undefined;
    let latestHistoryId: string | undefined;

    try {
      do {
        const { data } = await gmail.users.history.list({
          userId: GMAIL_USER_ID,
          startHistoryId,
          historyTypes: ['messageAdded', 'labelRemoved'],
          pageToken,
        });

        latestHistoryId = data.historyId ?? latestHistoryId;

        for (const history of data.history ?? []) {
          for (const added of history.messagesAdded ?? []) {
            if (added.message?.id) newMessageIds.add(added.message.id);
          }

          if (pendingLabelId) {
            for (const removed of history.labelsRemoved ?? []) {
              if (removed.message?.id && removed.labelIds?.includes(pendingLabelId)) {
                pendingRemovedIds.add(removed.message.id);
              }
            }
          }
        }

        pageToken = data.nextPageToken ?? undefined;
      } while (pageToken);
    } catch (err: any) {
      if (err?.code === 404) {
        this.logger.warn(`historyId too old/invalid, skipping diff from ${startHistoryId}`);
        return { newMessageIds: [], pendingRemovedIds: [] };
      }
      throw err;
    }

    return { newMessageIds: [...newMessageIds], pendingRemovedIds: [...pendingRemovedIds], latestHistoryId };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private async getStudentDomains(): Promise<string[]> {
    return await this.emailDomainsService.getDomains(Role.Student);
  }

  // kept intentionally minimal: label id lookup lives in GmailLabelIdsService
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
