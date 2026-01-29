import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('class-registration/class-registrations')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne, ResourceAction.Create],
})
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(
    private readonly classRegistrationsService: ClassRegistrationsService
  ) {
    super(classRegistrationsService);
  }

  protected getDtoClasses() {
    return { query: QueryDto, create: CreateDto };
  }

  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() body?: unknown, @Payload() payload?: unknown) {
    const dto = body ?? payload;
    return this.service.create(await this.dto('create', dto));
  }
}

