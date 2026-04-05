import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth } from '@authentication/decorators/auth.decorator';
import { QueryDto } from '@authentication/dtos/users/query.dto';
import { UpdateProfileDto } from '@authentication/dtos/users/update-profile.dto';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { AuthService } from '@authentication/services/auth.service';
import { UsersService } from '@authentication/services/users.service';
import { REFRESH_COOKIE, getClearCookieOptions, getRefreshCookieOptions } from '@authentication/utils/cookie.util';
import { Body, Controller, Get, Inject, Post, Put, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { GrpcMethod } from '@nestjs/microservices';
import jwtConfig from '@shared/config/jwt.config';
import { Request, Response } from 'express';

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
  @Auth(AuthType.Bearer)
  async findOne(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }

  @Put('me')
  @Auth(AuthType.Bearer)
  async updateMe(@ActiveUser('sub') sub: ActiveUserData['sub'], @Body() dto: UpdateProfileDto) {
    return this.userService.update(sub, dto);
  }

  @GrpcMethod('AuthService', 'FindOneByKeyword')
  async findOneByKeyword(@Body() { keyword }: { keyword?: string }) {
    const { items } = await this.userService.findAll({
      keyword,
      limit: 1,
      roles: [Role.Admin],
      isActive: true,
    } as QueryDto);
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
