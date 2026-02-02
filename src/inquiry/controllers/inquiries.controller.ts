import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { CreateDto } from '@inquiry/dtos/inquiries/create.dto';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { GrpcExceptionFilter } from '@shared/filters/grpc-exception.filter';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@UseFilters(GrpcExceptionFilter)
@Controller('inquiryModule/inquiries')
export class InquiriesController extends ResourceController<Inquiry> {
  constructor(protected readonly service: InquiriesService) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto, create: CreateDto };
  }

  @Post()
  @GrpcMethod('InquiryService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
