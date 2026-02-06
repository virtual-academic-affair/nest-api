import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Post,
} from '@nestjs/common';
import { RegistrationItemsService } from '@class-registration/services/registration-items.service';
import { ProcessItemDto } from '@class-registration/dtos/registrations/process-item.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('registration-items')
export class RegistrationItemsController {
  constructor(
    private readonly registrationItemsService: RegistrationItemsService
  ) {}

  /**
   * GET /registration-items/:id
   * Lấy thông tin một item
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.registrationItemsService.findOne(id);
  }

  /**
   * GET /registration-items/by-registration/:registrationId
   * Lấy tất cả items của một registration
   */
  @Get('by-registration/:registrationId')
  async findByRegistrationId(
    @Param('registrationId', ParseIntPipe) registrationId: number
  ) {
    return await this.registrationItemsService.findByRegistrationId(
      registrationId
    );
  }

  /**
   * PUT /registration-items/:id/process
   * Xử lý một item (Approve/Reject) - full update
   */
  @Put(':id/process')
  async processItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ProcessItemDto
  ) {
    return await this.registrationItemsService.processItem(id, dto);
  }

  /**
   * POST /registration-items/process-bulk
   * Xử lý nhiều items cùng lúc
   */
  @Post('process-bulk')
  async processBulk(@Body() body: { ids: number[]; status: ProcessItemDto }) {
    return await this.registrationItemsService.processBulk(body.ids, body.status);
  }
}
