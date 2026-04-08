import { randomUUID } from 'crypto';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshTokenDto } from '@authentication/dtos/auth/refresh-token.dto';
import { User } from '@authentication/entities/user.entity';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { SuperEmailSetting } from '@email/interfaces/super-email-setting.type';
import jwtConfig from '@shared/config/jwt.config';
import { RedisService } from '@shared/services/redis.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly settingService: SettingService,
  ) {}

  private getRFTRedisKey(refreshTokenId: string | number): string {
    return `refresh_token:${refreshTokenId}`;
  }

  async generateTokens(user: User) {
    throwUnless(user?.isActive, new UnauthorizedException('User is inactive'));

    const accessToken = await this.signToken<Partial<ActiveUserData>>(user.id, this.jwtConfiguration.accessTokenTtl, {
      email: user.email,
      role: user.role,
    });

    const refreshTokenId = randomUUID();
    const refreshToken = await this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, { refreshTokenId });

    await this.redisService.set(
      this.getRFTRedisKey(refreshTokenId),
      user.id.toString(),
      this.jwtConfiguration.refreshTokenTtl,
    );
    return { accessToken, refreshToken };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{
      refreshTokenId: string;
    }>(dto.refreshToken, this.jwtConfiguration);
    throwUnless(payload?.refreshTokenId, new UnauthorizedException('Refresh token is invalid'));

    const userId = await this.redisService.get(this.getRFTRedisKey(payload.refreshTokenId));
    throwUnless(userId, new UnauthorizedException('Refresh token has expired'));

    const user = await this.userRepository.findOneBy({ id: +userId });
    throwUnless(!!user?.isActive, new UnauthorizedException('User not found or inactive'));

    await this.redisService.del(this.getRFTRedisKey(payload.refreshTokenId));
    return this.generateTokens(user);
  }

  private async signToken<T>(sub: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      { sub, ...payload },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  async generateSuperToken(email: string) {
    const superEmail = (await this.settingService.get<SuperEmailSetting>(SettingKey.EmailSuperEmail))['email'];
    throwUnless(email === superEmail, new UnauthorizedException('Unauthorized email address'));

    const user = await this.userRepository.findOneBy({ email });
    return await this.generateTokens(user);
  }
}
