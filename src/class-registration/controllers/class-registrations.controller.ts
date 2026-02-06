import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Controller, Get, Post, Body, Param, ParseIntPipe } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ReplyDto, ReplyPreviewResponse } from '@class-registration/dtos/class-registrations/reply.dto';
import { CreateClassRegistrationDto } from '@class-registration/dtos/registrations/create.dto';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('class-registrations')
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(
    private readonly classRegistrationsService: ClassRegistrationsService
  ) {
    super(classRegistrationsService);
  }

  protected getDtoClasses() {
    return {
      query: QueryDto,
      create: CreateClassRegistrationDto,
    };
  }

  /**
   * GET /class-registrations/stats/:type?
   * Thống kê (type: 'overview' | 'register' | 'cancel' | 'request-open')
   * Mặc định: overview
   */
  @Get('stats/:type?')
  async getStats(
    @Param('type') type?: 'overview' | 'register' | 'cancel' | 'request-open'
  ) {
    return await this.classRegistrationsService.getStats(type);
  }

  /**
   * GET /class-registrations/:id/reply/preview
   * Xem trước nội dung email reply (cho chế độ manual)
   * Trả về: to, subject, greeting, summary, fullBody
   */
  @Get(':id/reply/preview')
  async previewReply(
    @Param('id', ParseIntPipe) id: number
  ): Promise<ReplyPreviewResponse> {
    return await this.classRegistrationsService.previewReply(id);
  }

  /**
   * POST /class-registrations/:id/reply
   * Gửi email phản hồi cho sinh viên
   * - Auto mode: gửi greeting, hệ thống tự tạo nội dung
   * - Manual mode: gửi fullBody đã được user chỉnh sửa
   */
  @Post(':id/reply')
  async reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplyDto
  ) {
    return await this.classRegistrationsService.sendReply(id, dto);
  }

  /**
   * POST /class-registrations
   * HTTP: Admin tạo tay với full data
   * gRPC: ClassRegistrationService.Create - tạo từ messageId (TODO: parse email)
   */
  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() dto: CreateClassRegistrationDto) {
    return await this.classRegistrationsService.createRegistration(dto);
  }
}
