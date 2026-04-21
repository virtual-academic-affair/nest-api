import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { ResourceDto } from '@inquiry/dtos/inquiries/resource.dto';
import { StatsDto } from '@inquiry/dtos/inquiries/stats.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('inquiry/inquiries')
export class InquiriesController extends ResourceController<Inquiry> {
  constructor(protected readonly service: InquiriesService) {
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
  async reply(@Param('id', ParseIntPipe) id: number) {
    return await this.service.sendReply(id);
  }

  @Post()
  @GrpcMethod('InquiryService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
