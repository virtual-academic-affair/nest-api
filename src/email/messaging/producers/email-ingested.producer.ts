import { User } from '@authentication/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@authentication/enums/role.enum';
import { EmailRoutingKey } from '@shared/enums/rabbitmq.enum';
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

export interface EmailIngestedPayload {
  internal: { id: number; gmailMessageId: string };
  subject?: string;
  senderEmail?: string;
  senderName?: string;
  content: string;
}

@Injectable()
export class EmailIngestedProducer {
  private readonly logger = new Logger(EmailIngestedProducer.name);

  private adminEmails = new Set<string>();

  private superEmail?: string;

  private allowedDomains: string[] = [];

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  private async handleAndPublish(
    gmail: gmail_v1.Gmail,
    gmailMessageId: string,
    shouldIgnoreSender: (email?: string) => boolean
  ): Promise<void> {
    const exists = await this.emailRepository.findOne({
      where: { gmailMessageId },
    });

    if (exists) {
      return;
    }

    const { data } = await gmail.users.messages.get({
      userId: 'me',
      id: gmailMessageId,
      format: 'full',
    });

    const parsed = parseMessage(data);

    const senderEmail = parsed.headers.from?.match(/<(.+)>/)?.[1];
    if (shouldIgnoreSender(senderEmail)) {
      return;
    }

    const email = await this.emailRepository.save({
      gmailMessageId,
      headerMessageId: parsed.headers['message-id'],
      threadId: data.threadId,
      subject: parsed.headers.subject,
      labelIds: data.labelIds ?? [],
      sentAt: parsed.headers.date ? new Date(parsed.headers.date) : undefined,
      senderEmail,
      senderName: parsed.headers.from,
    });

    await this.publish({
      internal: { id: email.id, gmailMessageId },
      subject: email.subject,
      senderEmail: email.senderEmail,
      senderName: email.senderName,
      content: htmlToText(parsed.textHtml ?? parsed.textPlain ?? '', {
        wordwrap: false,
      }),
    });
  }

  private async publish(payload: EmailIngestedPayload): Promise<void> {
    await this.rabbitmqService.publish(EmailRoutingKey.Ingested, payload);
  }

  private async loadEmailPolicies() {
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

  private shouldIgnoreSender(email?: string): boolean {
    if (!email) {
      return true;
    }

    return !(
      this.adminEmails.has(email) ||
      email === this.superEmail ||
      this.allowedDomains.some((allowed) => email.endsWith(allowed))
    );
  }

  public async sync() {
    await this.loadEmailPolicies();

    const lastPull =
      (await this.settingService.get<string>(SettingKey.EmailLastPullAt)) ??
      new Date(Date.now() - 24 * 60 * 60_000).toISOString();

    const since = new Date(lastPull);
    const gmail = await this.googleapisService.getGmailClient();
    const ids = await this.listMessages(gmail, since);

    if (!ids.length) {
      await this.updateLastPull();
      return;
    }

    for (const id of ids) {
      try {
        await this.handleMessage(gmail, id);
      } catch (e) {
        console.log(e);
        this.logger.warn(`Skip message ${id}`, e);
      }
    }

    await this.updateLastPull();
  }

  private async listMessages(
    gmail: gmail_v1.Gmail,
    since: Date
  ): Promise<string[]> {
    const after = Math.floor(since.getTime() / 1000);
    const result: string[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const { data } = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${after}`,
        includeSpamTrash: false,
        pageToken,
      });

      result.push(...(data.messages?.map((m) => m.id).filter(Boolean) ?? []));
      pageToken = data.nextPageToken ?? undefined;
    } while (pageToken);

    return result;
  }

  private async handleMessage(gmail: gmail_v1.Gmail, id: string) {
    await this.handleAndPublish(gmail, id, (email) =>
      this.shouldIgnoreSender(email)
    );
  }

  private async updateLastPull() {
    await this.settingService.set(
      SettingKey.EmailLastPullAt,
      new Date().toISOString()
    );
  }
}
