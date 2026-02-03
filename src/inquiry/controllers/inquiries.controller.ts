import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@inquiry/dtos/inquiries/create.dto';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
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
