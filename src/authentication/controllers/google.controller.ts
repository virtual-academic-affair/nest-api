import { GoogleService } from '@authentication/services/google.service';
import { GoogleGmailProfile } from '@authentication/strategies/google-gmail.strategy';
import { GoogleProfile } from '@authentication/strategies/google.strategy';
import { REFRESH_COOKIE, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
import { GrantsService } from '@email/services/grants.service';
import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import jwtConfig from '@shared/config/jwt.config';
import { Request, Response } from 'express';

@Controller('authentication/google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    private readonly grantsService: GrantsService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Get()
  @UseGuards(AuthGuard('google'))
  async googleRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const profile = req.user as GoogleProfile;
    const tokens = await this.googleService.login(profile);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, getRefreshCookieOptions(this.jwtConfiguration.refreshTokenTtl));
    return res.redirect(`${process.env.APP_URL}?token="${tokens.accessToken}"`);
  }

  @Get('grant-gmail')
  @UseGuards(AuthGuard('google-gmail'))
  grantGmail(@Req() req: Request) {
    return this.grantsService.grant(req.user as GoogleGmailProfile);
  }
}
