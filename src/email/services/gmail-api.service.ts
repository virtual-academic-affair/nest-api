import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { gmail_v1, google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import googleConfig from '@shared/config/google.config';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GmailApiService implements OnModuleInit {
  public oAuthClient: OAuth2Client;

  constructor(
    @Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>,
    private readonly settingService: SettingService,
  ) {}

  onModuleInit() {
    this.oAuthClient = new google.auth.OAuth2(this.googleConfiguration);
  }

  async getGmailClient(): Promise<gmail_v1.Gmail> {
    const account = await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail);
    throwUnless(account?.email && account.refreshToken, new NotFoundException('Super email is not configured'));

    this.oAuthClient.setCredentials({ refresh_token: account.refreshToken });
    return google.gmail({ version: 'v1', auth: this.oAuthClient });
  }
}
