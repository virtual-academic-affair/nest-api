import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';

@Injectable()
export class GoogleapisService implements OnModuleInit {
  public oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly settingService: SettingService
  ) {}

  onModuleInit() {
    const googleConfig = this.configService.get('google');
    this.oAuthClient = new google.auth.OAuth2(googleConfig);
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
}
