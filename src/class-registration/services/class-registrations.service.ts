import { Body, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';

import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns = ['studentCode', 'studentName'];
  protected orderableColumns = ['academicYear', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(ClassRegistration) repository: Repository<ClassRegistration>,
    @InjectRepository(ClassRegistrationItem) private readonly itemDetailRepository: Repository<ClassRegistrationItem>,
  ) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.loadRelationCountAndMap('itemsCount', 'items');
  }

  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.relation('items');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<ClassRegistration>,
    { studentCode, academicYear, status, action, smartOrder }: QueryDto,
  ): void {
    studentCode && queryBuilder.andWhere({ studentCode });
    academicYear && queryBuilder.andWhere({ academicYear });
    status && queryBuilder.andWhere('items.status = :status', { status });
    action && queryBuilder.andWhere('items.action = :action', { action });

    if (smartOrder) {
      queryBuilder
        .leftJoinAndSelect(`${this.entityName}.items`, 'items')
        .leftJoinAndSelect(`${this.entityName}.message`, 'message')
        .orderBy(`${this.entityName}.academicYear`, 'ASC')
        .addOrderBy('items.isInCurriculum', 'DESC')
        .addOrderBy(`COALESCE(message.sentAt, ${this.entityName}.createdAt)`, 'ASC');
    }
  }

  async create(@Body() dto: CreateDto) {
    const existing = await this.repository.findOneBy({ messageId: dto.messageId });
    throwIf(existing, new ConflictException('Registration already exists'));

    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date) {
    const stats = await this.itemDetailRepository
      .createQueryBuilder('item')
      .select([
        'DATE(item.createdAt) AS date',
        'item.action AS action',
        'COUNT(*) AS total',
        `SUM(CASE WHEN item.status = '${RegistrationStatus.Pending}' THEN 1 ELSE 0 END) AS pending`,
        `SUM(CASE WHEN item.status = '${RegistrationStatus.Approved}' THEN 1 ELSE 0 END) AS approved`,
        `SUM(CASE WHEN item.status = '${RegistrationStatus.Rejected}' THEN 1 ELSE 0 END) AS rejected`,
      ])
      .where('item.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('date, action')
      .getRawMany();

    return stats.reduce((acc, { date, action, ...counts }) => {
      acc[date] = acc[date] || { total: 0 };
      acc[date][action] = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v]));
      acc[date].total += +counts.total;
      return acc;
    }, {});
  }

  async previewReply(id: number) {
    return this.findOne(id);
  }

  async sendReply(id: number, _dto: any) {
    return this.findOne(id);
  }
}
