import { Controller, Get, Inject, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { Request } from 'express';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { GoogleOAuthGuard } from '@authentication/guards/google-oauth.guard';
import { GoogleProfile } from '@authentication/strategies/google.strategy';
import { GoogleService } from '@authentication/services/google.service';
import { REFRESH_COOKIE, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
import jwtConfig from '@shared/config/jwt.config';

@Controller('authentication/google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Get()
  @UseGuards(GoogleOAuthGuard)
  authenticateGoogle() {
    return;
  }

  @Auth(AuthType.None)
  @Get('redirect')
  @UseGuards(GoogleOAuthGuard)
  async googleRedirect(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const profile = req.user as GoogleProfile;
    const tokens = await this.googleService.login(profile);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, getRefreshCookieOptions(this.jwtConfiguration.refreshTokenTtl));
    return { accessToken: tokens.accessToken };
  }
}
