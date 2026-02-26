import { Controller } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@class-registration/dtos/class-registration-items/create.dto';
import { UpdateDto } from '@class-registration/dtos/class-registration-items/update.dto';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ClassRegistrationItemsService } from '@class-registration/services/class-registration-items.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@RestrictMethods({ except: [ResourceAction.FindAll, ResourceAction.FindOne] })
@Controller('classRegistration/classRegistrations/:parentId/items')
export class ClassRegistrationItemsController extends ResourceController<ClassRegistrationItem> {
  constructor(protected readonly service: ClassRegistrationItemsService) {
    super(service);
  }

  protected getDtoClasses() {
    return { create: CreateDto, update: UpdateDto };
  }
}
