import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { CancelReason } from '@class-registration/entities/cancel-reason.entity';
import { QueryDto } from '@class-registration/dtos/cancel-reasons/query.dto';

@Injectable()
export class CancelReasonsService extends ResourceService<CancelReason> {
  protected searchableColumns = ['content'];

  protected orderableColumns = ['id', 'createdAt'];

  constructor(
    @InjectRepository(CancelReason) repository: Repository<CancelReason>
  ) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<CancelReason>,
    { isActive }: QueryDto
  ): void {
    isActive !== undefined && queryBuilder.andWhere({ isActive });
  }
}
