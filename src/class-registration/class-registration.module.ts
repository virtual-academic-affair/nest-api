import { Module } from '@nestjs/common';
import { NlpClassRegistrationConsumer } from './messaging/consumers/nlp-class-registration.consumer';

@Module({
  providers: [NlpClassRegistrationConsumer],
  exports: [],
})
export class ClassRegistrationModule {}
