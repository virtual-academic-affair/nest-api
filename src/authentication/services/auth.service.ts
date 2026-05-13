import { randomUUID } from 'crypto';
import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import type { Redis } from 'ioredis';
import { Repository } from 'typeorm';
import { Role } from '@authentication/decorators/roles.decorator';
import { RefreshTokenDto } from '@authentication/dtos/auth/refresh-token.dto';
import { User } from '@authentication/entities/user.entity';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import jwtConfig from '@shared/config/jwt.config';
import { RedisService } from '@shared/redis/redis.service';
import { SettingKey } from '@shared/setting/enums/setting-key.enum';
import { SettingService } from '@shared/setting/services/setting.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    redisService: RedisService,
    private readonly settingService: SettingService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {
    this.redis = redisService.getOrThrow();
  }

  private readonly redis: Redis;

  private getRFTRedisKey(refreshTokenId: string | number): string {
    return `refresh_token:${refreshTokenId}`;
  }

  async generateTokens(user: User, withRefreshToken: boolean = true) {
    throwUnless(user?.isActive, new ForbiddenException('User is banned'));

    const accessToken = await this.signToken(user.id, this.jwtConfiguration.accessTokenTtl, {
      email: user.email,
      role: user.role,
      ...(user.studentCode ? { studentCode: user.studentCode } : {}),
    });

    if (!withRefreshToken) {
      return { accessToken };
    }

    const refreshTokenId = randomUUID();
    const refreshToken = await this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, { refreshTokenId });

    await this.redis.set(
      this.getRFTRedisKey(refreshTokenId),
      user.id.toString(),
      'EX',
      this.jwtConfiguration.refreshTokenTtl,
    );
    return { accessToken, refreshToken };
  }

  async refreshTokens(dto: RefreshTokenDto) {
    const payload = await this.jwtService.verifyAsync<{
      refreshTokenId: string;
    }>(dto.refreshToken, this.jwtConfiguration);
    throwUnless(payload?.refreshTokenId, new UnauthorizedException('Refresh token is invalid'));

    const userId = await this.redis.get(this.getRFTRedisKey(payload.refreshTokenId));
    throwUnless(userId, new UnauthorizedException('Refresh token has expired'));

    const user = await this.userRepository.findOneBy({ id: +userId });
    throwUnless(!!user?.isActive, new ForbiddenException('User is banned'));

    await this.redis.del(this.getRFTRedisKey(payload.refreshTokenId));
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

  async issueGmailExtensionSession(email: string): Promise<{
    isAdmin: boolean;
    isSuperAdmin: boolean;
    accessToken?: string | null;
  }> {
    const user = await this.userRepository.findOneBy({ email });
    const isAdmin = user?.isActive && user.role === Role.Admin;

    if (!isAdmin || !user) {
      return { isAdmin: false, isSuperAdmin: false };
    }

    const isSuperAdmin = (await this.settingService.get<SuperEmail>(SettingKey.EmailSuperEmail))?.email === email;
    const tokens = await this.generateTokens(user, false);
    return { isAdmin, isSuperAdmin, accessToken: tokens.accessToken };
  }
}
