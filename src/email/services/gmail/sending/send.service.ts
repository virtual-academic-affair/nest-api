import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import MailComposer = require('nodemailer/lib/mail-composer');
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { GMAIL_ACTION_TRIGGERED_EVENT } from '@email/constants/gmail-log.constants';
import { SendEmailDto } from '@email/dtos/messages/send-email.dto';
import { GmailApiService } from '@email/services/gmail-api.service';
import { GmailActionTriggeredEvent } from '@email/types/gmail-log.types';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GmailSendService {
  private readonly logger = new Logger(GmailSendService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly configService: ConfigService,
    private readonly settingService: SettingService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async send(
    { to, subject, content, senderName, threadId, messageId }: SendEmailDto,
    audit: Partial<GmailActionTriggeredEvent> = {},
  ): Promise<string> {
    senderName ??= this.configService.get<string>('app.name');
    const account = await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail);
    const from = `"${senderName}" <${account.email}>`;
    try {
      const gmail = await this.gmailApiService.getGmailClient();

      const headers: Record<string, string> = {};
      messageId && (headers['In-Reply-To'] = messageId);
      messageId && (headers['References'] = messageId);
      const compiledMime = await new MailComposer({
        from,
        to,
        subject,
        html: content ?? '',
        headers,
      })
        .compile()
        .build();

      const encodedEmail = Buffer.from(compiledMime)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const { data } = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedEmail, threadId },
      });

      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail: audit.accountEmail ?? account.email,
        action: audit.action ?? 'Gửi email',
        status: 'success',
        from: audit.from ?? from,
        to: audit.to ?? to,
        detail: audit.detail,
        gmailMessageId: data.id,
        detailGmailMessageId: audit.detailGmailMessageId ?? data.id,
        threadId: audit.threadId ?? data.threadId ?? threadId,
        suppressDetailLink: audit.suppressDetailLink,
        dedupeKey: this.resolveSuccessDedupeKey(audit, data.id),
      });

      this.logger.log(`Email sent to ${to} with message ID: ${data.id}`);
      return data.id;
    } catch (error: any) {
      this.eventEmitter.emit(GMAIL_ACTION_TRIGGERED_EVENT, {
        accountEmail: audit.accountEmail ?? account?.email ?? null,
        action: audit.action ?? 'Gửi email',
        status: 'failed',
        from: audit.from ?? from,
        to: audit.to ?? to,
        detail: audit.detail,
        detailGmailMessageId: audit.detailGmailMessageId,
        threadId: audit.threadId ?? threadId,
        suppressDetailLink: audit.suppressDetailLink,
        error: error?.message ?? String(error),
        dedupeKey: audit.dedupeKey,
      });
      throw error;
    }
  }

  private resolveSuccessDedupeKey(
    audit: Partial<GmailActionTriggeredEvent>,
    gmailMessageId?: string | null,
  ): string | null | undefined {
    if (!gmailMessageId) {
      return audit.dedupeKey;
    }

    if (audit.action === 'Gửi phản hồi') {
      return `outbound:reply:${gmailMessageId}`;
    }

    return audit.dedupeKey;
  }
}
