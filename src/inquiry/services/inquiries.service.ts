import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(@InjectRepository(Inquiry) repository: Repository<Inquiry>) {
    super(repository);
  }
}
