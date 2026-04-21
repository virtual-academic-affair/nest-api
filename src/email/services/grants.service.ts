import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { google } from 'googleapis';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';
import { CodeDto } from '@email/dtos/grants/code.dto';
import { GmailApiService } from '@email/services/gmail/gmail-api.service';
import { GmailWebhookService } from '@email/services/gmail/gmail-webhook.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GrantsService {
  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailWebhookService: GmailWebhookService,
    private readonly settingService: SettingService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  generateAuthUrl(redirectUrl?: string): string {
    const options = {
      access_type: 'offline',
      scope: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.modify'],
      include_granted_scopes: true,
      prompt: 'consent',
      ...(redirectUrl ? { redirect_uri: redirectUrl } : {}),
    };
    return this.gmailApiService.oAuthClient.generateAuthUrl(options);
  }

  async grant(dto: CodeDto) {
    const { tokens } = await this.gmailApiService.oAuthClient.getToken({
      code: dto.code,
      redirect_uri: dto.redirectUrl,
    });
    throwUnless(tokens?.refresh_token, new BadRequestException('Missing refresh token'));

    this.gmailApiService.oAuthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: this.gmailApiService.oAuthClient });
    const { data: profile } = await oauth2.userinfo.get();
    throwUnless(profile?.email, new BadRequestException('Missing email address'));

    await this.settingService.set(SettingKey.EmailSuperEmail, {
      email: profile.email,
      refreshToken: tokens.refresh_token,
      name: profile.name,
      picture: profile.picture,
    });

    await this.userRepository.upsert(
      {
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        googleId: profile.id.toString(),
        role: Role.Admin,
      },
      ['email'],
    );

    const gmail = await this.gmailApiService.getGmailClient();
    const { data: gmailProfile } = await gmail.users.getProfile({ userId: 'me' });
    await this.settingService.set(SettingKey.EmailGmailHistoryId, gmailProfile.historyId);
    await this.gmailWebhookService.setupAndWatch();
  }
}
