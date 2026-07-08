import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { GmailExtensionSessionDto } from '@authentication/dtos/auth/gmail-extension-session.dto';
import { AuthService } from '@authentication/services/auth.service';
import { UsersService } from '@authentication/services/users.service';
import { REFRESH_COOKIE, getClearCookieOptions, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
import { Body, Controller, Get, Headers, Inject, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod } from '@nestjs/microservices';
import gmailExtensionConfig from '@shared/config/gmail-extension.config';
import jwtConfig from '@shared/config/jwt.config';
import { Request, Response } from 'express';

export const GMAIL_EXTENSION_SESSION_SECRET_HEADER = 'x-gmail-session-secret';

@Controller('authentication/auth')
export class AuthenticationController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    @Inject(gmailExtensionConfig.KEY)
    private readonly gmailExtensionConfiguration: ConfigType<typeof gmailExtensionConfig>,
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
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    try {
      await this.authService.deleteRefreshToken(req.cookies[REFRESH_COOKIE]);
    } catch {
    } finally {
      res.clearCookie(REFRESH_COOKIE, getClearCookieOptions());
    }
    return {};
  }

  @Post('gmail-extension-session')
  async gmailExtensionSession(
    @Body() dto: GmailExtensionSessionDto,
    @Headers(GMAIL_EXTENSION_SESSION_SECRET_HEADER) sessionSecret: string | string[] | undefined,
  ) {
    const expected = this.gmailExtensionConfiguration.sessionSecret ?? '';
    throwIf(expected && sessionSecret !== expected, new UnauthorizedException('Session secret mismatch'));
    return this.authService.issueGmailExtensionSession(dto.email);
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
