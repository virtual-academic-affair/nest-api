import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// eslint-disable-next-line @typescript-eslint/no-require-imports
import MailComposer = require('nodemailer/lib/mail-composer');
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { SendEmailDto } from '@email/dtos/messages/send-email.dto';
import { GmailApiService } from '@email/services/gmail-api.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GmailSendService {
  private readonly logger = new Logger(GmailSendService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly configService: ConfigService,
    private readonly settingService: SettingService,
  ) {}

  async send({ to, subject, content, senderName, threadId, messageId }: SendEmailDto): Promise<string> {
    const gmail = await this.gmailApiService.getGmailClient();

    senderName ??= this.configService.get<string>('app.name');
    const account = await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail);

    const headers: Record<string, string> = {};
    messageId && (headers['In-Reply-To'] = messageId);
    messageId && (headers['References'] = messageId);
    const compiledMime = await new MailComposer({
      from: `"${senderName}" <${account.email}>`,
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

    this.logger.log(`Email sent to ${to} with message ID: ${data.id}`);
    return data.id;
  }
}
