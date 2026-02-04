import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Task } from '@task/entities/task.entity';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from '@task/services/tasks.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task])],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [],
})
export class TaskModule {}
