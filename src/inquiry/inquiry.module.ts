import { Module } from '@nestjs/common';
import { NlpInquiryConsumer } from './messaging/consumers/nlp-inquiry.consumer';

@Module({
  providers: [NlpInquiryConsumer],
  exports: [],
})
export class InquiryModule {}
