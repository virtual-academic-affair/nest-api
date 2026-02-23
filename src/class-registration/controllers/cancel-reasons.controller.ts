import { Controller } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@class-registration/dtos/cancel-reasons/create.dto';
import { QueryDto } from '@class-registration/dtos/cancel-reasons/query.dto';
import { UpdateDto } from '@class-registration/dtos/cancel-reasons/update.dto';
import { CancelReason } from '@class-registration/entities/cancel-reason.entity';
import { CancelReasonsService } from '@class-registration/services/cancel-reasons.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('classRegistrations/cancelReasons')
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
