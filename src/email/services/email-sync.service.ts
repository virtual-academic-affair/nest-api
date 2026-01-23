import { User } from '@authentication/entities/user.entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@authentication/enums/role.enum';
import { EmailRoutingKey } from '@shared/enums/rabbitmq.enum';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import * as parseMessage from 'gmail-api-parse-message';
import { gmail_v1 } from 'googleapis';
import { htmlToText } from 'html-to-text';
import { Repository } from 'typeorm';
import { Email } from '../entities/email.entity';
import { SuperEmailSetting } from '../types/super-email-setting.type';
import { GoogleapisService } from './googleapis.service';

@Injectable()
export class EmailSyncService {
  private readonly logger = new Logger(EmailSyncService.name);

  private adminEmails = new Set<string>();

  private superEmail?: string;

  private allowedDomains: string[] = [];

  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    private readonly rabbitmqService: RabbitMQService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>
  ) {}

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
    const exists = await this.emailRepository.findOne({
      where: { gmailMessageId: id },
    });

    if (exists) {
      return;
    }

    const { data } = await gmail.users.messages.get({
      userId: 'me',
      id,
      format: 'full',
    });

    const parsed = parseMessage(data);

    const senderEmail = parsed.headers.from?.match(/<(.+)>/)?.[1];
    if (this.shouldIgnoreSender(senderEmail)) {
      return;
    }

    const email = await this.emailRepository.save({
      gmailMessageId: id,
      headerMessageId: parsed.headers['message-id'],
      threadId: data.threadId,

      subject: parsed.headers.subject,
      labelIds: data.labelIds ?? [],
      sentAt: parsed.headers.date ? new Date(parsed.headers.date) : undefined,

      senderEmail,
      senderName: parsed.headers.from,
    });

    await this.rabbitmqService.publish(EmailRoutingKey.Ingested, {
      internal: { id: email.id, gmailMessageId: id },
      subject: email.subject,
      senderEmail: email.senderEmail,
      senderName: email.senderName,
      content: htmlToText(parsed.textHtml ?? parsed.textPlain ?? '', {
        wordwrap: false,
      }),
    });
  }

  private async updateLastPull() {
    await this.settingService.set(
      SettingKey.EmailLastPullAt,
      new Date().toISOString()
    );
  }
}
