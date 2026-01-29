import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiriesController } from './controllers/inquiries.controller';
import { InquiriesService } from '@inquiry/services/inquiries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Inquiry])],
  controllers: [InquiriesController],
  providers: [InquiriesService],
  exports: [],
})
export class InquiryModule {}
