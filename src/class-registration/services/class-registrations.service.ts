import { Body, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateDto } from '@class-registration/dtos/class-registrations/create.dto';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { ClassRegistrationTemplate } from '@email/templates/class-registration.template';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns = ['studentCode', 'studentName'];
  protected orderableColumns = ['academicYear', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(ClassRegistration) repository: Repository<ClassRegistration>,
    @InjectRepository(ClassRegistrationItem) private readonly itemRepository: Repository<ClassRegistrationItem>,
    private readonly configService: ConfigService,
  ) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.loadRelationCountAndMap(this.p('itemsCount'), this.p('items'));
  }

  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.leftJoinAndSelect(this.p('items'), 'items');
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
        .leftJoinAndSelect(this.p('items'), 'items')
        .leftJoinAndSelect(this.p('message'), 'message')
        .orderBy(this.p('academicYear'), 'ASC')
        .addOrderBy('items.isInCurriculum', 'DESC')
        .addOrderBy(`COALESCE(message.sentAt, ${this.p('createdAt')}`, 'ASC');
    }
  }

  async create(@Body() dto: CreateDto) {
    const existing = dto?.messageId && (await this.repository.findOneBy({ messageId: dto.messageId }));
    throwIf(existing, new ConflictException('Registration already exists'));

    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date) {
    const stats = await this.itemRepository
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
      date = new Date(date).toISOString();

      acc[date] = acc[date] || { date, total: 0, detail: {} };
      acc[date]['detail'][action] = Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, +v]));
      acc[date].total += +counts.total;
      return acc;
    }, {});
  }

  async previewReply(id: number) {
    const classRegistration = await this.findOne(id);
    const template = new ClassRegistrationTemplate(this.configService, classRegistration);
    return { html: template.generate() };
  }

  async sendReply(id: number, dto: { content?: string }) {
    // TODO: Send email with dto.html
    return { success: true };
  }
}
