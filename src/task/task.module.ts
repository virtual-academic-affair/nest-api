import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@task/entities/task.entity';
import { TaskAssignee } from './entities/task-assignee.entity';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from '@task/services/tasks.service';
import { User } from '@authentication/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskAssignee, User])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [],
})
export class TaskModule {}
