import { BadRequestException, Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { GoogleapisService } from './googleapis.service';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { CodeDto } from '../dto/grants/code.dto';
import { EmailIngestedProducer } from '../messaging/producers/email-ingested.producer';

@Injectable()
export class GrantsService {
  constructor(
    private readonly googleapisService: GoogleapisService,
    private readonly settingService: SettingService,
    private readonly emailIngestedProducer: EmailIngestedProducer
  ) {}

  generateAuthUrl() {
    const options: any = {
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

    await this.emailIngestedProducer.sync();
  }
}
