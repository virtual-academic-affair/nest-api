import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { Inquiry } from '@inquiry/entities/inquiry.entity';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  protected searchableColumns: string[] = [];

  protected orderableColumns = ['id', 'messageId', 'createdAt', 'updatedAt'];

  constructor(@InjectRepository(Inquiry) repository: Repository<Inquiry>) {
    super(repository);
  }
}
