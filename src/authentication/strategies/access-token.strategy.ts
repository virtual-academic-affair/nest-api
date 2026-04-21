import { ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import jwtConfig from '@shared/config/jwt.config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: jwtConfiguration.audience,
      issuer: jwtConfiguration.issuer,
      secretOrKey: jwtConfiguration.secret,
    });
  }

  async validate(payload: ActiveUserData & { sub: number }): Promise<ActiveUserData> {
    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    throwUnless(user, new UnauthorizedException('User not found or inactive'));
    throwUnless(user.isActive, new ForbiddenException('User is banned'));

    return { sub: user.id, email: user.email, role: user.role };
  }
}
