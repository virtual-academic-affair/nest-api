import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from '@authentication/services/users.service';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { User } from '@authentication/entities/user.entity';
import { QueryDto } from '@authentication/dtos/users/query.dto';
import { UpdateDto } from '@authentication/dtos/users/update.dto';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('authentication/users')
@RestrictMethods({ except: [ResourceAction.Create, ResourceAction.Delete] })
export class UsersController extends ResourceController<User> {
  constructor(protected readonly service: UsersService) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto, update: UpdateDto };
  }

  @Post('assignRole')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.service.assignRole(dto);
  }
}
