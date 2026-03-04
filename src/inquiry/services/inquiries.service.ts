import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@inquiry/dtos/inquiries/query.dto';
import { Inquiry } from '@inquiry/entities/inquiry.entity';
import { InquiryType } from '@inquiry/enums/inquiry-type.enum';
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

  async stats(startDate: Date, endDate: Date) {
    const stats = await this.queryBuilder
      .select([
        `DATE(${this.p('createdAt')}) AS date`,
        'COUNT(*) AS total',
        `SUM(CASE WHEN '${InquiryType.Graduation}' = ANY(${this.p('types')}::text[]) THEN 1 ELSE 0 END) AS graduation`,
        `SUM(CASE WHEN '${InquiryType.Process}' = ANY(${this.p('types')}::text[]) THEN 1 ELSE 0 END) AS process`,
        `SUM(CASE WHEN '${InquiryType.Procedure}' = ANY(${this.p('types')}::text[]) THEN 1 ELSE 0 END) AS procedure`,
      ])
      .where(`${this.p('createdAt')} BETWEEN :startDate AND :endDate`, { startDate, endDate })
      .groupBy('date')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats.reduce((acc, row) => {
      acc[new Date(row.date).toISOString()] = {
        total: +row.total,
        types: {
          [InquiryType.Graduation]: +row.graduation,
          [InquiryType.Process]: +row.process,
          [InquiryType.Procedure]: +row.procedure,
        },
      };
      return acc;
    }, {});
  }
}
