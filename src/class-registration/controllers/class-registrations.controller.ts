import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ResourceDto } from '@class-registration/dtos/class-registrations/resource.dto';
import { StatsDto } from '@class-registration/dtos/class-registrations/stats.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { Label } from '@email/enums/label.enum';
import { LabelsService } from '@email/services/labels.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Jwt)
@Roles(Role.Admin)
@Controller('classRegistration/classRegistrations')
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(
    protected readonly service: ClassRegistrationsService,
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
  async reply(@Param('id', ParseIntPipe) id: number) {
    const message = await this.service.sendReply(id);
    await this.labelsService.label(message, [Label.ClassRegistration]);
  }

  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
