import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailModule } from '@email/email.module';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesService } from '@inquiry/services/inquiries.service';
import { InquiriesController } from './controllers/inquiries.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry]), EmailModule],
  controllers: [InquiriesController],
  providers: [InquiriesService],
  exports: [],
})
export class InquiryModule {}
