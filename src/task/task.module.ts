import { Module } from '@nestjs/common';
import { NlpTaskConsumer } from './messaging/consumers/nlp-task.consumer';

@Module({
  providers: [NlpTaskConsumer],
  exports: [],
})
export class TaskModule {}
