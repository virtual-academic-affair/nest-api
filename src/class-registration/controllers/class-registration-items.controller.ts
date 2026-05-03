import { Controller } from '@nestjs/common';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ResourceDto } from '@class-registration/dtos/class-registration-items/resource.dto';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ClassRegistrationItemsService } from '@class-registration/services/class-registration-items.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@RestrictMethods({ except: [ResourceAction.FindOne] })
@Controller('classRegistration/classRegistrations/:parentId/items')
export class ClassRegistrationItemsController extends ResourceController<ClassRegistrationItem> {
  constructor(protected readonly service: ClassRegistrationItemsService) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }
}
