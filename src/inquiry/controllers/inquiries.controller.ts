import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@inquiry/dtos/inquiries/create.dto';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { StatsDto } from '@inquiry/dtos/inquiries/stats.dto';
import { UpdateDto } from '@inquiry/dtos/inquiries/update.dto';
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
    return { query: QueryDto, create: CreateDto, update: UpdateDto };
  }

  @Get('stats')
  async getStats(@Query() query: StatsDto) {
    return await this.service.stats(new Date(query.from), new Date(query.to));
  }

  @Post()
  @GrpcMethod('InquiryService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
