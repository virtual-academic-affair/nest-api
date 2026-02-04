import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Controller, Get, Post, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { RegistrationQueryDto } from '@class-registration/dtos/registrations/query.dto';
import { CreateClassRegistrationDto } from '@class-registration/dtos/registrations/create.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('class-registrations')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne],
})
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(
    private readonly classRegistrationsService: ClassRegistrationsService
  ) {
    super(classRegistrationsService);
  }

  protected getDtoClasses() {
    return { query: RegistrationQueryDto };
  }

  /**
   * POST /class-registrations
   * Tạo mới class registration
   */
  @Post()
  async create(@Body() dto: CreateClassRegistrationDto) {
    return await this.classRegistrationsService.createRegistration(dto);
  }

  /**
   * GET /class-registrations/priority
   * Lấy danh sách registrations sắp xếp theo thứ tự ưu tiên
   */
  @Get('priority')
  async findAllWithPriority(@Query() queryDto: RegistrationQueryDto) {
    return await this.classRegistrationsService.findAllWithPriority(queryDto);
  }

  /**
   * GET /class-registrations/stats/overview
   * Thống kê tổng quan
   */
  @Get('stats/overview')
  async getOverviewStats() {
    return await this.classRegistrationsService.getOverviewStats();
  }

  /**
   * GET /class-registrations/stats/open-requests
   * Thống kê số lượng môn muốn mở
   */
  @Get('stats/open-requests')
  async getOpenRequestStats() {
    return await this.classRegistrationsService.getOpenRequestStats();
  }

  /**
   * GET /class-registrations/:id/details
   * Lấy chi tiết registration với tất cả items
   */
  @Get(':id/details')
  async findOneWithItems(@Param('id', ParseIntPipe) id: number) {
    return await this.classRegistrationsService.findOneWithItems(id);
  }


  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
