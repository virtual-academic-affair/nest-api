import { Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OAuth2Client } from 'google-auth-library';
import { Repository } from 'typeorm';
import { CodeDto } from '@authentication/dtos/google/code.dto';
import { User } from '@authentication/entities/user.entity';
import googleConfig from '@shared/config/google.config';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleService implements OnModuleInit {
  private oAuthClient: OAuth2Client;

  constructor(
    @Inject(googleConfig.KEY)
    private readonly googleConfiguration: ConfigType<typeof googleConfig>,
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  onModuleInit() {
    this.oAuthClient = new OAuth2Client(this.googleConfiguration);
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
    throwUnless(tokens?.id_token, new UnauthorizedException('Google token is missing'));

    const loginTicket = await this.oAuthClient.verifyIdToken({ idToken: tokens.id_token });
    const payload = loginTicket.getPayload();
    throwUnless(payload?.email, new UnauthorizedException('Google email is missing'));

    const email = payload.email;
    let user = await this.userRepository.findOneBy({ email });

    user = await this.userRepository.save({
      ...user,
      email,
      googleId: payload.sub,
      name: payload.name,
      picture: payload.picture,
    });

    return this.authService.generateTokens(user);
  }
}
