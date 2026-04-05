import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@authentication/entities/user.entity';
import { EmailModule } from '@email/email.module';
import { TaskAssignee } from '@task/entities/task-assignee.entity';
import { Task } from '@task/entities/task.entity';
import { TasksService } from '@task/services/tasks.service';
import { TasksController } from './controllers/tasks.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Task, TaskAssignee, User]), EmailModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [],
})
export class TaskModule {}
