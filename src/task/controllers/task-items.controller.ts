import { Controller } from '@nestjs/common';
import { Auth } from '@authentication/decorators/auth.decorator';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { CreateDto } from '@task/dtos/task-items/create.dto';
import { UpdateDto } from '@task/dtos/task-items/update.dto';
import { TaskItem } from '@task/entities/task-item.entity';
import { TaskItemsService } from '@task/services/task-items.service';

@Auth(AuthType.Bearer)
@RestrictMethods({ except: [ResourceAction.FindAll, ResourceAction.FindOne] })
@Controller('task/tasks/:parentId/items')
export class TaskItemsController extends ResourceController<TaskItem> {
  constructor(protected readonly service: TaskItemsService) {
    super(service);
  }

  protected getDtoClasses() {
    return { create: CreateDto, update: UpdateDto };
  }
}
