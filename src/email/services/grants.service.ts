import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleapisService } from '@email/services/googleapis.service';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { CodeDto } from '@email/dtos/grants/code.dto';
import { EmailSyncService } from '@email/services/email-sync.service';

@Injectable()
export class GrantsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    private readonly emailSyncService: EmailSyncService
  ) {}

  generateAuthUrl(): string {
    const options = {
      access_type: 'offline',
      scope: [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      include_granted_scopes: true,
      prompt: 'consent',
    };
    return this.googleapisService.oAuthClient.generateAuthUrl(options);
  }

  async grant(dto: CodeDto) {
    const { tokens } = await this.googleapisService.oAuthClient.getToken(
      dto.code
    );
    throwUnless(
      tokens?.refresh_token,
      new BadRequestException('Missing refresh token')
    );

    this.googleapisService.oAuthClient.setCredentials(tokens);
    const gmail = google.gmail({
      version: 'v1',
      auth: this.googleapisService.oAuthClient,
    });
    const { data } = await gmail.users.getProfile({ userId: 'me' });
    throwUnless(
      data?.emailAddress,
      new BadRequestException('Missing email address')
    );

    await this.settingService.set(SettingKey.EmailSuperEmail, {
      email: data.emailAddress,
      refreshToken: tokens.refresh_token,
    });

    this.emailSyncService.run().then(() => 1);
  }
}
