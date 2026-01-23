import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { User } from '../entities/user.entity';
import { QueryDto } from '@authentication/dtos/users/query.dto';
import { UpdateDto } from '@authentication/dtos/users/update.dto';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';

@ApiTags('Users')
@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('authentication/users')
@RestrictMethods({ except: [ResourceAction.Create, ResourceAction.Delete] })
export class UsersController extends ResourceController<User> {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  protected getDtoClasses() {
    return { query: QueryDto, update: UpdateDto };
  }

  @Post('assignRole')
  assignRole(@Body() dto: AssignRoleDto) {
    return this.usersService.assignRole(dto);
  }
}
