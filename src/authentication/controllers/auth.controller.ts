import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { RefreshTokenDto } from '@authentication/dtos/auth/refresh-token.dto';
import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { UsersService } from '../services/users.service';
import { AuthService } from '@authentication/services/auth.service';

@Controller('authentication/auth')
export class AuthenticationController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService
  ) {}

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  async findOne(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }
}
