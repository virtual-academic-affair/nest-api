import { Body, Controller, Post } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { Task } from '@task/entities/task.entity';
import { QueryDto } from '@task/dtos/tasks/query.dto';
import { CreateDto } from '@task/dtos/tasks/create.dto';
import { UpdateDto } from '@task/dtos/tasks/update.dto';
import { TasksService } from '@task/services/tasks.service';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('taskModule/tasks')
export class TasksController extends ResourceController<Task> {
  constructor(protected readonly service: TasksService) {
    super(service);
  }

  protected getDtoClasses() {
    return { query: QueryDto, create: CreateDto, update: UpdateDto };
  }

  @Post()
  @GrpcMethod('TaskService', 'Create')
  async create(@Body() dto: unknown) {
    return super.create(dto);
  }
}
