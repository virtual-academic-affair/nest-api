import { Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { ActiveUser } from '@authentication/decorators/active-user.decorator';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { LabelsService } from '@email/services/labels.service';
import { CreateDto, ResourceDto } from '@inquiry/dtos/inquiries/resource.dto';
import { StatsDto } from '@inquiry/dtos/inquiries/stats.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('inquiry/inquiries')
export class InquiriesController extends ResourceController<Inquiry> {
  constructor(
    protected readonly service: InquiriesService,
    protected readonly labelsService: LabelsService,
  ) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Get('stats')
  async getStats(@Query() query: StatsDto) {
    return await this.service.stats(new Date(query.from), new Date(query.to));
  }

  @Get(':id/reply')
  async previewReply(@Param('id', ParseIntPipe) id: number) {
    return await this.service.previewReply(id);
  }

  @Post(':id/reply')
  async reply(@Param('id', ParseIntPipe) id: number, @ActiveUser('email') actorEmail: string) {
    const message = await this.service.sendReply(id, actorEmail);
    await this.labelsService.label(message, message.inquiry?.types ?? [], [], false, actorEmail);
  }

  @Auth(AuthType.Grpc)
  @GrpcMethod('InquiryService', 'Create')
  async createGrpc(@Payload() dto: CreateDto) {
    return super.create(dto);
  }
}
