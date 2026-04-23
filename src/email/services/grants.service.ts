import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';
import { GoogleGmailProfile } from '@authentication/strategies/google-gmail.strategy';
import { GmailApiService } from '@email/services/gmail-api.service';
import { GmailWebhookService } from '@email/services/gmail/gmail-webhook.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { Repository } from 'typeorm';

@Injectable()
export class GrantsService {
  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly gmailWebhookService: GmailWebhookService,
    private readonly settingService: SettingService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async grant(profile: GoogleGmailProfile) {
    throwUnless(profile?.email, new BadRequestException('Missing email address'));
    throwUnless(profile?.refreshToken, new BadRequestException('Missing refresh token'));

    await this.settingService.set(SettingKey.EmailSuperEmail, profile);

    await this.userRepository.upsert(
      {
        ...profile,
        role: Role.Admin,
      },
      ['email'],
    );

    this.gmailApiService.oAuthClient.setCredentials({ refresh_token: profile.refreshToken });

    const gmail = await this.gmailApiService.getGmailClient();
    const { data: gmailProfile } = await gmail.users.getProfile({ userId: 'me' });
    await this.settingService.set(SettingKey.EmailGmailHistoryId, gmailProfile.historyId);
    await this.gmailWebhookService.setupWatch();
  }
}
