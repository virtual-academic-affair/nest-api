import { Body, Controller, Get, Inject, Post, Query, Res } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { CodeDto } from '@authentication/dtos/google/code.dto';
import { GoogleService } from '@authentication/services/google.service';
import { REFRESH_COOKIE, refreshCookieOptions } from '@authentication/utils/cookie.util';
import jwtConfig from '@shared/config/jwt.config';

@Controller('authentication/google')
export class GoogleController {
  constructor(
    private readonly googleService: GoogleService,
    @Inject(jwtConfig.KEY) private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  @Get()
  getGoogleUrl(@Query('redirectUrl') redirectUrl?: string) {
    return this.googleService.generateAuthUrl(redirectUrl);
  }

  @Post()
  async authenticate(@Body() dto: CodeDto, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.googleService.authenticate(dto);

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions(this.jwtConfiguration.refreshTokenTtl));

    return { accessToken: tokens.accessToken };
  }
}
