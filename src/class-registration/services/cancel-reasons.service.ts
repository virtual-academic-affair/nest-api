import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@class-registration/dtos/cancel-reasons/query.dto';
import { CancelReason } from '@class-registration/entities/cancel-reason.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class CancelReasonsService extends ResourceService<CancelReason> {
  protected searchableColumns = ['content'];

  constructor(@InjectRepository(CancelReason) repository: Repository<CancelReason>) {
    super(repository);
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<CancelReason>, { isActive }: QueryDto): void {
    isActive !== undefined && queryBuilder.andWhere({ isActive });
  }
}
