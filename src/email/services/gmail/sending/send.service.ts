import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

    const headers: Record<string, string> = {
      To: to,
      Subject: subject,
      From: `"${senderName}" <${account.email}>`,
      'MIME-Version': '1.0',
      'Content-Type': 'text/html; charset=UTF-8',
    };

    threadId && (headers['Thread-Id'] = threadId);

    if (messageId) {
      headers['In-Reply-To'] = messageId;
      headers['References'] = messageId;
    }

    let emailContent = '';
    for (const [key, value] of Object.entries(headers)) {
      emailContent += `${key}: ${value}\r\n`;
    }
    emailContent += '\r\n' + content;

    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const { data } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail, threadId: threadId },
    });

    this.logger.log(`Email sent to ${to} with message ID: ${data.id}`);
    return data.id;
  }
}
