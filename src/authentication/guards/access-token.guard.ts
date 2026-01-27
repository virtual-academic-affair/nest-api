import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from '@shared/config/jwt.config';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';

export const REQUEST_USER_KEY = 'user';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    throwUnless(token, new UnauthorizedException('Access token is missing'));

    const payload = await this.jwtService.verifyAsync(
      token,
      this.jwtConfiguration
    );
    throwUnless(payload, new UnauthorizedException('Access token is invalid'));

    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    throwUnless(user, new UnauthorizedException('User not found or inactive'));
    throwUnless(
      user.isActive,
      new UnauthorizedException('User not found or inactive')
    );

    request[REQUEST_USER_KEY] = payload;
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [, token] = request.headers.authorization?.split(' ') ?? [];
    return token;
  }
}
