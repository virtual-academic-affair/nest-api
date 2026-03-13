import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { AuthService } from '@authentication/services/auth.service';
import { UsersService } from '@authentication/services/users.service';
import jwtConfig from '@shared/config/jwt.config';

@Controller('authentication/auth')
export class AuthenticationController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    throwUnless(refreshToken, new UnauthorizedException('Refresh token cookie is missing'));
    const tokens = await this.authService.refreshTokens({ refreshToken });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: this.jwtConfiguration.refreshTokenTtl * 1000,
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
    });
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  async findOne(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }

  @GrpcMethod('AuthService', 'FindOneByKeyword')
  async findOneByKeyword(@Body() { keyword }: { keyword?: string }) {
    const { items } = await this.userService.findAll({ keyword, limit: 1 });
    return items[0] || {};
  }

  @GrpcMethod('AuthService', 'VerifyToken')
  async verifyToken(@Body() { token }: { token: string }) {
    const data = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
    return {
      payload: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    };
  }
}
