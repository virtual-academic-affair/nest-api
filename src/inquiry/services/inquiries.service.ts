import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { applyMessageFilters } from '@shared/resource/dtos/message-resource-query.dto';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class InquiriesService extends ResourceService<Inquiry> {
  constructor(@InjectRepository(Inquiry) repository: Repository<Inquiry>) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Inquiry>,
    { messageId, messageStatuses }: QueryDto,
  ): void {
    applyMessageFilters(queryBuilder, { messageId, messageStatuses });
  }
}
