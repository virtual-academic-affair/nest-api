import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Controller } from '@nestjs/common';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { CancelReason } from '@class-registration/entities/cancel-reason.entity';
import { CancelReasonsService } from '@class-registration/services/cancel-reasons.service';
import { QueryDto } from '@class-registration/dtos/cancel-reasons/query.dto';
import { CreateDto } from '@class-registration/dtos/cancel-reasons/create.dto';
import { UpdateDto } from '@class-registration/dtos/cancel-reasons/update.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('classRegistrationModule/cancelReasons')
export class CancelReasonsController extends ResourceController<CancelReason> {
  constructor(protected readonly service: CancelReasonsService) {
    super(service);
  }

  protected getDtoClasses() {
    return {
      query: QueryDto,
      create: CreateDto,
      update: UpdateDto,
    };
  }
}
