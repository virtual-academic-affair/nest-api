import { Body, Controller, Post } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { ResourceDto } from '@authentication/dtos/users/resource.dto';
import { User } from '@authentication/entities/user.entity';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { UsersService } from '@authentication/services/users.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('authentication/users')
@RestrictMethods({ except: [ResourceAction.Create, ResourceAction.Delete] })
export class UsersController extends ResourceController<User> {
  constructor(protected readonly service: UsersService) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Post('assignRole')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.service.assignRole(dto);
  }
}
