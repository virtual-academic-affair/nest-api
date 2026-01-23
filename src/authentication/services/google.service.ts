import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { AuthService } from './auth.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';
import { SettingService } from '@shared/setting/services/setting.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { CodeDto } from '@authentication/dtos/google/code.dto';

@Injectable()
export class GoogleService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly settingService: SettingService
  ) {}

  onModuleInit() {
    const googleConfig = this.configService.get('google');
    this.oAuthClient = new OAuth2Client(googleConfig);
  }

  generateAuthUrl() {
    return this.oAuthClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      prompt: 'consent',
    });
  }

  async authenticate(dto: CodeDto) {
    const { tokens } = await this.oAuthClient.getToken(dto.code);
    throwUnless(
      tokens?.id_token,
      new UnauthorizedException('Google token is missing')
    );

    const loginTicket = await this.oAuthClient.verifyIdToken({
      idToken: tokens.id_token,
    });
    const payload = loginTicket.getPayload();
    throwUnless(
      payload?.email,
      new UnauthorizedException('Google email is missing')
    );
    const email = payload.email.toLowerCase();

    const adminEmails =
      (await this.settingService.get<string[]>(
        SettingKey.AuthenticationAdminEmails
      )) ?? [];
    const normalizedAdminEmails = adminEmails
      .filter(Boolean)
      .map((item) => item.toLowerCase());
    const isAdmin = normalizedAdminEmails.includes(email);

    let user = await this.userRepository.findOneBy({ email });
    const userData = {
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
      role: isAdmin ? Role.Admin : user?.role ?? Role.Student,
      email,
    };

    user = await this.userRepository.save({
      ...user,
      ...userData,
      isActive: user?.isActive ?? true,
    });

    return this.authService.generateTokens(user);
  }
}
