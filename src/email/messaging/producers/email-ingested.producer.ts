import { User } from '@authentication/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@authentication/enums/role.enum';
import { RoutingKey } from '@shared/enums/rabbitmq.enum';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { Repository } from 'typeorm';
import { Email } from '../../entities/email.entity';
import { SuperEmailSetting } from '../../types/super-email-setting.type';
import { GoogleapisService } from '../../services/googleapis.service';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { BaseProducer } from '@shared/messaging/producers/base.producer';

export interface EmailIngestedPayload {
  internal: { id: number; gmailMessageId: string };
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  content: string;
}

@Injectable()
export class EmailIngestedProducer extends BaseProducer<EmailIngestedPayload> {
  protected readonly routingKey = RoutingKey.Ingested;

  private readonly logger = new Logger(EmailIngestedProducer.name);

  private adminEmails = new Set<string>();

  private superEmail?: string;

  private allowedDomains: string[] = [];

  constructor(
    rabbitmqService: RabbitMQService,
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {
    super(rabbitmqService);
  }

  public async sync(): Promise<void> {
    await this.loadEmailPolicies();

    const lastPullTimestamp = await this.getLastPullTimestamp();
    const gmail = await this.googleapisService.getGmailClient();
    const messageIds = await this.fetchMessageIdsSince(
      gmail,
      lastPullTimestamp
    );

    if (messageIds.length === 0) {
      await this.updateLastPullTimestamp();
      return;
    }

    for (const messageId of messageIds) {
      try {
        await this.processAndPublishMessage(gmail, messageId);
      } catch (error) {
        this.logger.warn(`Skip message ${messageId}`, error);
      }
    }

    await this.updateLastPullTimestamp();
  }

  private async loadEmailPolicies(): Promise<void> {
    const [admins, superEmailSetting, allowedDomainsSetting] =
      await Promise.all([
        this.userRepository.find({
          where: { role: Role.Admin, isActive: true },
          select: ['email'],
        }),
        this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail),
        this.settingService.get<string[]>(SettingKey.EmailAllowedDomains),
      ]);

    this.adminEmails = new Set(
      admins.map((u) => u.email).filter((email): email is string => !!email)
    );
    this.superEmail = superEmailSetting?.email ?? undefined;
    this.allowedDomains = (allowedDomainsSetting ?? []).filter(Boolean);
  }

  private async fetchMessageIdsSince(
    gmail: gmail_v1.Gmail,
    since: Date
  ): Promise<string[]> {
    const afterTimestamp = Math.floor(since.getTime() / 1000);
    const messageIds: string[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${afterTimestamp}`,
        includeSpamTrash: false,
        pageToken,
      });

      messageIds.push(
        ...(data.messages?.map((m) => m.id).filter(Boolean) ?? [])
      );
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return messageIds;
  }

  private async processAndPublishMessage(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string
  ): Promise<void> {
    const exists = await this.emailRepository.findOne({
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

    if (!this.isAllowedSender(senderEmail)) {
      return;
    }

    const email = await this.emailRepository.save({
      gmailMessageId,
      headerMessageId: parsedMessage.headers['message-id'],
      threadId: gmailMessage.threadId,
      subject: parsedMessage.headers.subject,
      labelIds: gmailMessage.labelIds ?? [],
      sentAt: parsedMessage.headers.date
        ? new Date(parsedMessage.headers.date)
        : undefined,
      senderEmail,
      senderName: parsedMessage.headers.from,
    });

    const textContent = parsedMessage.textHtml ?? parsedMessage.textPlain ?? '';
    const plainTextContent = htmlToText(textContent, { wordwrap: false });

    await this.publish({
      internal: { id: email.id, gmailMessageId: email.gmailMessageId },
      subject: email.subject,
      senderEmail: email.senderEmail,
      senderName: email.senderName,
      content: plainTextContent,
    });
  }

  private isAllowedSender(senderEmail?: string): boolean {
    if (!senderEmail) {
      return false;
    }

    return (
      this.adminEmails.has(senderEmail) ||
      senderEmail === this.superEmail ||
      this.allowedDomains.some((domain) => senderEmail.endsWith(domain))
    );
  }

  private async getLastPullTimestamp(): Promise<Date> {
    const lastPullIsoString = await this.settingService.get<string>(
      SettingKey.EmailLastPullAt
    );

    if (lastPullIsoString) {
      return new Date(lastPullIsoString);
    }

    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return new Date(twentyFourHoursAgo);
  }

  private async updateLastPullTimestamp(): Promise<void> {
    await this.settingService.set(
      SettingKey.EmailLastPullAt,
      new Date().toISOString()
    );
  }
}
