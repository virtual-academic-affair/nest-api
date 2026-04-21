import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { ResourceItemService } from '@shared/resource/services/resource-item.service';
import { Request as TRequest } from 'express';
import { Repository } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class ClassRegistrationItemsService extends ResourceItemService<ClassRegistrationItem> {
  constructor(
    @InjectRepository(ClassRegistrationItem) repository: Repository<ClassRegistrationItem>,
    @Inject(REQUEST) request: TRequest,
  ) {
    super(repository, request);
  }

  async stats(startDate: Date, endDate: Date) {
    const stats = await this.queryBuilder
      .select([
        `DATE(${this.p('createdAt')}) AS date`,
        `${this.p('action')} AS action`,
        'COUNT(*) AS total',
        `SUM(CASE WHEN ${this.p('status')} = '${RegistrationStatus.Pending}' THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN ${this.p('status')} = '${RegistrationStatus.Approved}' THEN 1 ELSE 0 END) AS approved`,
        `SUM(CASE WHEN ${this.p('status')} = '${RegistrationStatus.Rejected}' THEN 1 ELSE 0 END) AS rejected`,
      ])
      .where(`${this.p('createdAt')} BETWEEN :startDate AND :endDate`, { startDate, endDate })
      .groupBy('date')
      .addGroupBy(`${this.p('action')}`)
      .getRawMany();

    return stats.reduce((acc, { date, action, ...counts }) => {
      date = new Date(date).toISOString();

      acc[date] = acc[date] || { date, total: 0, detail: {} };
      acc[date]['detail'][action] = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v]));
      acc[date].total += +counts.total;
      return acc;
    }, {});
  }
}
