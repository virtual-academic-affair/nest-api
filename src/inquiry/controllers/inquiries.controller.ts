import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { CreateDto } from '@inquiry/dtos/inquiries/create.dto';
import { InquiriesService } from '@inquiry/services/inquiries.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('inquiry/inquiries')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Create],
})
export class InquiriesController extends ResourceController<Inquiry> {
  constructor(private readonly inquiriesService: InquiriesService) {
    super(inquiriesService);
  }

  protected getDtoClasses() {
    return { query: QueryDto, create: CreateDto };
  }

  @Post()
  @GrpcMethod('InquiryService', 'Create')
  async create(@Body() dto: unknown) {
    return this.service.create(await this.dto('create', dto));
  }
}
