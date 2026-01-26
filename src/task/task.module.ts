import { Module } from '@nestjs/common';
import { TaskConsumer } from './messaging/consumers/task.consumer';

@Module({
  providers: [TaskConsumer],
  exports: [],
})
export class TaskModule {}
