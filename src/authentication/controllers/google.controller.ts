import { Body, Controller, Get, Inject, Post, Query, Res } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Response } from 'express';
import { CodeDto } from '@authentication/dtos/google/code.dto';
import { GoogleService } from '@authentication/services/google.service';
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

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: this.jwtConfiguration.refreshTokenTtl * 1000,
    });

    return { accessToken: tokens.accessToken };
  }
}
