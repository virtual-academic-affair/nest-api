import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
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
