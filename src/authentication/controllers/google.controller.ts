import { Controller, Get, Inject, Logger, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Request, Response } from 'express';
import { GoogleGmailGuard } from '@authentication/guards/google-gmail.guard';
import { GoogleGuard } from '@authentication/guards/google.guard';
import { GoogleService } from '@authentication/services/google.service';
import { GrantsService } from '@authentication/services/grants.service';
import { SuperEmail } from '@authentication/strategies/google-gmail.strategy';
import { GoogleProfile } from '@authentication/strategies/google.strategy';
import { REFRESH_COOKIE, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
import jwtConfig from '@shared/config/jwt.config';

@Controller('authentication/google')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly grantsService: GrantsService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Get()
  @UseGuards(GoogleGuard)
  async googleRedirect(@Req() req: Request, @Query('state') state: string, @Res() res: Response) {
    const profile = req.user as GoogleProfile;

    try {
      const tokens = await this.googleService.login(profile);
      res.cookie(REFRESH_COOKIE, tokens.refreshToken, getRefreshCookieOptions(this.jwtConfiguration.refreshTokenTtl));
      return res.redirect(`${state}?token="${tokens.accessToken}"`);
    } catch (error) {
      const message = (error as Error)?.message || 'Authentication failed';
      return res.redirect(`${state}?error=${encodeURIComponent(message)}`);
    }
  }

  @Get('grant-gmail')
  @UseGuards(GoogleGmailGuard)
  async grantGmail(@Req() req: Request, @Query('state') state: string, @Res() res: Response) {
    let isSuccess = false;

    try {
      await this.grantsService.grant(req.user as SuperEmail);
      isSuccess = true;
    } catch (error) {
      this.logger.error(`Grant Gmail failed: ${error.message}`, error.stack);
    }

    return res.redirect(`${state}?grant=${isSuccess}`);
  }
}
