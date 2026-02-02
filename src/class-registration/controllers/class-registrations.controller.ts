import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { GrpcExceptionFilter } from '@shared/filters/grpc-exception.filter';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@UseFilters(GrpcExceptionFilter)
@Controller('classRegistrationModule/classRegistrations')
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(protected readonly service: ClassRegistrationsService) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto, create: CreateDto };
  }

  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
