import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Controller, Get } from '@nestjs/common';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { CancelReasonMaster } from '@class-registration/entities/cancel-reason-master.entity';
import { CancelReasonsService } from '@class-registration/services/cancel-reasons.service';
import { CancelReasonQueryDto } from '@class-registration/dtos/cancel-reasons/query.dto';
import { CreateCancelReasonDto } from '@class-registration/dtos/cancel-reasons/create.dto';
import { UpdateCancelReasonDto } from '@class-registration/dtos/cancel-reasons/update.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('cancel-reasons')
export class CancelReasonsController extends ResourceController<CancelReasonMaster> {
  constructor(private readonly cancelReasonsService: CancelReasonsService) {
    super(cancelReasonsService);
  }

  protected getDtoClasses() {
    return {
      query: CancelReasonQueryDto,
      create: CreateCancelReasonDto,
      update: UpdateCancelReasonDto,
    };
  }

  /**
   * GET /cancel-reasons/all
   * Lấy tất cả lý do (dùng cho dropdown)
   */
  @Get('all')
  async findAllReasons() {
    return await this.cancelReasonsService.findAllReasons();
  }
}
