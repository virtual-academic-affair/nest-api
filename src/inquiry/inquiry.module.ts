import { Module } from '@nestjs/common';
import { InquiryConsumer } from './messaging/consumers/inquiry.consumer';

@Module({
  providers: [InquiryConsumer],
  exports: [],
})
export class InquiryModule {}
