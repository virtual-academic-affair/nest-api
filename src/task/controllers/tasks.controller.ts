import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Role } from '@authentication/enums/role.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { CreateDto } from '@task/dtos/tasks/create.dto';
import { QueryDto } from '@task/dtos/tasks/query.dto';
import { StatsDto } from '@task/dtos/tasks/stats.dto';
import { UpdateDto } from '@task/dtos/tasks/update.dto';
import { Task } from '@task/entities/task.entity';
import { TasksService } from '@task/services/tasks.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('task/tasks')
export class TasksController extends ResourceController<Task> {
  constructor(protected readonly service: TasksService) {
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
  @GrpcMethod('TaskService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
