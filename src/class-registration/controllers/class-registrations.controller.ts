import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ReplyDto } from '@class-registration/dtos/class-registrations/reply.dto';
import { StatsDto } from '@class-registration/dtos/class-registrations/stats.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('classRegistrations')
export class ClassRegistrationsController extends ResourceController<ClassRegistration> {
  constructor(protected readonly service: ClassRegistrationsService) {
    super(service);
  }

  protected getDtoClasses() {
    return {
      query: QueryDto,
      create: CreateDto,
    };
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
  async reply(@Param('id', ParseIntPipe) id: number, @Body() dto: ReplyDto) {
    return await this.service.sendReply(id, dto.content);
  }

  @Post()
  @GrpcMethod('ClassRegistrationService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
