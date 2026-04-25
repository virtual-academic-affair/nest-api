import { Body, Controller, Get, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { AuthService } from '@authentication/services/auth.service';
import { UsersService } from '@authentication/services/users.service';
import { REFRESH_COOKIE, getClearCookieOptions, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
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
    const refreshToken = req.cookies[REFRESH_COOKIE];
    throwUnless(refreshToken, new UnauthorizedException('Refresh token cookie is missing'));
    const tokens = await this.authService.refreshTokens({ refreshToken });
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, getRefreshCookieOptions(this.jwtConfiguration.refreshTokenTtl));

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    return res.clearCookie(REFRESH_COOKIE, getClearCookieOptions());
  }

  @Get('me')
  @Auth(AuthType.Jwt)
  async findOne(@ActiveUser('id') userId: number) {
    return this.userService.findOne(userId);
  }

  @GrpcMethod('AuthService', 'VerifyToken')
  async verifyToken(@Body() { token }: { token: string }) {
    const data = await this.jwtService.verifyAsync(token, this.jwtConfiguration);
    return { payload: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) };
  }
}
