import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { Repository } from 'typeorm';
import { Message } from '@email/entities/message.entity';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { GoogleapisService } from '@email/services/googleapis.service';
import { RABBIT_SERVICE } from '@shared/config/constants';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

export const INGESTED = 'ingested';

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  constructor(
    @Inject(RABBIT_SERVICE) private readonly client: ClientProxy,
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    @InjectRepository(Message) private readonly messageRepository: Repository<Message>,
  ) {}

  async run(): Promise<void> {
    const [lastPullTimestamp, allowedDomains, gmail, superEmail] = await Promise.all([
      this.getLastPullTimestamp(),
      this.settingService.get<string[]>(SettingKey.EmailAllowedDomains),
      this.googleapisService.getGmailClient(),
      this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail),
    ]);

    const messageIds = await this.fetchMessageIdsSince(gmail, lastPullTimestamp, allowedDomains);

    for (const messageId of messageIds) {
      try {
        this.logger.log(`Processing message ${messageId}`);
        await this.processAndPublishMessage(gmail, messageId, superEmail.email);
      } catch (error) {
        this.logger.warn(`Skip message ${messageId}`, error);
      }
    }

    await this.updateLastPullTimestamp();
  }

  private async fetchMessageIdsSince(gmail: gmail_v1.Gmail, since: Date, allowedDomains: string[]): Promise<string[]> {
    const afterTimestamp = Math.floor(since.getTime() / 1000);
    const messageIds: string[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${afterTimestamp} -from:me (${allowedDomains?.map((d) => `from:*@${d}`)?.join(' OR ')})`,
        includeSpamTrash: false,
        pageToken,
      });

      messageIds.push(...(data.messages?.map((m) => m.id).filter(Boolean) ?? []));
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    this.logger.log(`Fetched ${messageIds.length} message IDs since ${since.toISOString()}`);
    return messageIds;
  }

  private async processAndPublishMessage(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    superEmail: string,
  ): Promise<void> {
    const exists = await this.messageRepository.findOne({
      where: { gmailMessageId },
    });
    if (exists) {
      return;
    }

    const { data: gmailMessage } = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId,
      format: 'full',
    });

    const parsedMessage = parseMessage(gmailMessage);
    const senderEmail = parsedMessage.headers.from?.match(/<(.+)>/)?.[1];

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
    });

    const textContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const plainTextContent = htmlToText(textContent, { wordwrap: false });

    this.client.emit(INGESTED, {
      messageId: message.id,
      subject: message.subject,
      senderEmail: message.senderEmail,
      senderName: message.senderName,
      content: plainTextContent,
    });
  }

  private async getLastPullTimestamp(): Promise<Date> {
    const lastPullIsoString = await this.settingService.get<string>(SettingKey.EmailLastPullAt);

    if (lastPullIsoString) {
      return new Date(lastPullIsoString);
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(twentyFourHoursAgo);
  }

  private async updateLastPullTimestamp(): Promise<void> {
    await this.settingService.set(
      SettingKey.EmailLastPullAt,
      new Date(Date.now() - 30000).toISOString(), // 30s ago
    );
  }
}
