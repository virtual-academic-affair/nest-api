import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CodeDto } from '@email/dtos/grants/code.dto';
import { GrantsService } from '@email/services/grants.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/grants')
export class GrantsController {
  constructor(private readonly grantsService: GrantsService) {}

  @Get()
  getAuthUrl() {
    return this.grantsService.generateAuthUrl();
  }

  @Post()
  grant(@Body() dto: CodeDto) {
    return this.grantsService.grant(dto);
  }
}
