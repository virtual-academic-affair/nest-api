import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { QueryDto } from '@class-registration/dtos/class-registration-items/query.dto';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable({ scope: Scope.REQUEST })
export class ClassRegistrationItemsService extends ResourceService<ClassRegistrationItem> {
  protected searchableColumns = ['subjectName', 'subjectCode', 'className'];
  protected orderableColumns = ['id', 'subjectName', 'action', 'status'];

  private readonly classRegistrationId: number;

  constructor(
    @InjectRepository(ClassRegistrationItem) repository: Repository<ClassRegistrationItem>,
    @Inject(REQUEST) private readonly request: any,
  ) {
    super(repository);
    this.classRegistrationId = Number(this.request.params?.classRegistrationId);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<ClassRegistrationItem>,
    { status, action, rejectReasons }: QueryDto,
  ): void {
    status && queryBuilder.andWhere({ status });
    action && queryBuilder.andWhere({ action });
    rejectReasons?.length && queryBuilder.andWhere({ rejectReasons: In(rejectReasons) });
  }

  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistrationItem>): void {
    queryBuilder.andWhere({ registrationId: this.classRegistrationId });
  }

  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistrationItem>): void {
    this.withAll(queryBuilder);
  }

  async create(createDto: any): Promise<ClassRegistrationItem> {
    return await super.create({ ...createDto, registrationId: this.classRegistrationId });
  }
}
