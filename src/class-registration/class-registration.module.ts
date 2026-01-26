import { Module } from '@nestjs/common';
import { ClassRegistrationConsumer } from './messaging/consumers/class-registration.consumer';

@Module({
  providers: [ClassRegistrationConsumer],
  exports: [],
})
export class ClassRegistrationModule {}
