import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '@authentication/decorators/roles.decorator';
import { User } from '@authentication/entities/user.entity';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { WatchService } from '@email/services/gmail/webhook/watch.service';
import { GmailApiService } from '@email/services/gmail-api.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class GrantsService {
  constructor(
    private readonly gmailApiService: GmailApiService,
    private readonly watchService: WatchService,
    private readonly settingService: SettingService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async grant(profile: SuperEmail) {
    throwUnless(profile?.email, new BadRequestException('Missing email address'));
    throwUnless(profile?.refreshToken, new BadRequestException('Missing refresh token'));

    await Promise.all([
      this.settingService.set(SettingKey.EmailSuperEmail, profile),
      this.userRepository.upsert({ ...profile, role: Role.Admin }, ['email']),
      this.settingService.remove(SettingKey.EmailLabels),
      this.settingService.remove(SettingKey.EmailGmailHistoryId),
    ]);

    this.gmailApiService.oAuthClient.setCredentials({ refresh_token: profile.refreshToken });
    await this.watchService.sync('grant');
  }
}
