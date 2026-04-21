import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailDomainsByRole } from '@authentication/types/email-domains-by-role.type';
import { User } from '@authentication/entities/user.entity';
import { normalizeEmailDomainsByRole, resolveEmail } from '@authentication/utils/resolve-email.util';
import googleConfig from '@shared/config/google.config';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { GoogleProfile } from '@authentication/strategies/google.strategy';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleService {
  constructor(
    @Inject(googleConfig.KEY) private readonly googleConfiguration: ConfigType<typeof googleConfig>,
    private readonly authService: AuthService,
    private readonly settingService: SettingService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  getRedirectUrl() {
    return this.googleConfiguration.redirectUri;
  }

  async login(profile: GoogleProfile) {
    const email = profile.email.toLowerCase();
    let user: Partial<User> = await this.userRepository.findOneBy({ email });

    if (!user) {
      const emailDomainsByRole = normalizeEmailDomainsByRole(
        await this.settingService.get<EmailDomainsByRole>(SettingKey.AuthEmailDomains),
      );
      user = resolveEmail(email, emailDomainsByRole);
    }

    user = await this.userRepository.save({
      ...user,
      email,
      googleId: profile.googleId,
      name: profile.name,
      picture: profile.picture,
    });

    return this.authService.generateTokens(user as User);
  }
}
