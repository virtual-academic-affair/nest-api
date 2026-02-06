import {
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import googleConfig from '@shared/config/google.config';

@Injectable()
export class GoogleapisService implements OnModuleInit {
  public oAuthClient: OAuth2Client;

  constructor(
    @Inject(googleConfig.KEY)
    private readonly googleConfiguration: ConfigType<typeof googleConfig>,
    private readonly settingService: SettingService
  ) {}

  onModuleInit() {
    this.oAuthClient = new google.auth.OAuth2(this.googleConfiguration);
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const account = await this.settingService.get<SuperEmailSetting>(
      SettingKey.EmailSuperEmail
    );
    throwUnless(
      account?.email && account.refreshToken,
      new NotFoundException('Super email is not configured')
    );

    const oauthClient = this.oAuthClient;
    oauthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: oauthClient });
  }

  /**
   * Send an email reply via Gmail API
   * @param to Recipient email address
   * @param subject Email subject
   * @param body Email body (plain text)
   * @param inReplyTo Original Message-ID header for threading
   */
  async sendReply(
    to: string,
    subject: string,
    body: string,
    inReplyTo?: string
  ): Promise<void> {
    const gmail = await this.getGmailClient();
    const account = await this.settingService.get<SuperEmailSetting>(
      SettingKey.EmailSuperEmail
    );

    // Build email with proper headers for threading
    const headers = [
      `To: ${to}`,
      `From: ${account!.email}`,
      `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}`,
      'Content-Type: text/plain; charset=utf-8',
    ];

    if (inReplyTo) {
      headers.push(`In-Reply-To: ${inReplyTo}`);
      headers.push(`References: ${inReplyTo}`);
    }

    const email = [...headers, '', body].join('\r\n');

    // Encode to base64url
    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    });
  }
}
