import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@authentication/entities/user.entity';
import { TaskItem } from '@task/entities/task-item.entity';
import { Task } from '@task/entities/task.entity';
import { TaskItemsService } from '@task/services/task-items.service';
import { TasksService } from '@task/services/tasks.service';
import { TaskItemsController } from './controllers/task-items.controller';
import { TasksController } from './controllers/tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskItem, User])],
  controllers: [TasksController, TaskItemsController],
  providers: [TasksService, TaskItemsService],
  exports: [],
})
export class TaskModule {}
