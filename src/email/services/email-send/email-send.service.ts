import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailDto } from '@email/dtos/messages/send-email.dto';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { GmailApiService } from '@email/services/gmail/gmail-api.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class EmailSendService {
  private readonly logger = new Logger(EmailSendService.name);

  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly configService: ConfigService,
    private readonly settingService: SettingService,
  ) {}

  async send({ to, subject, content, senderName, threadId, messageId }: SendEmailDto): Promise<string> {
    const gmail = await this.gmailApiService.getGmailClient();

    senderName ??= this.configService.get<string>('app.name');
    const account = await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail);

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

    // Construct raw email
    let emailContent = '';
    for (const [key, value] of Object.entries(headers)) {
      emailContent += `${key}: ${value}\r\n`;
    }
    emailContent += '\r\n' + content;

    // Encode to base64url
    const encodedEmail = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Send the email
    const { data } = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedEmail, threadId: threadId },
    });

    this.logger.log(`Email sent to ${to} with message ID: ${data.id}`);
    return data.id;
  }
}
