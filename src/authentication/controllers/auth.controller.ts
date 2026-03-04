import { Body, Controller, Get, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth } from '@authentication/decorators/auth.decorator';
import { RefreshTokenDto } from '@authentication/dtos/auth/refresh-token.dto';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { AuthService } from '@authentication/services/auth.service';
import { UsersService } from '@authentication/services/users.service';

@Controller('authentication/auth')
export class AuthenticationController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @Post('refresh')
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Get('me')
  @Auth(AuthType.Bearer)
  @GrpcMethod('AuthService', 'Me')
  async findOne(@ActiveUser('sub') sub: ActiveUserData['sub']) {
    return this.userService.findOne(sub);
  }

  @GrpcMethod('AuthService', 'FindOneByKeyword')
  async findOneByKeyword(@Body() { keyword }: { keyword?: string }) {
    const { items } = await this.userService.findAll({ keyword, limit: 1 });
    return { user: items[0] || null };
  }
}
