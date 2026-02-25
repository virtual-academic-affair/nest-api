import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
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

  protected get queryBuilder(): SelectQueryBuilder<ClassRegistrationItem> {
    return super.queryBuilder.where({ classRegistrationId: this.classRegistrationId });
  }

  async create(createDto: any): Promise<ClassRegistrationItem> {
    return await super.create({ ...createDto, classRegistrationId: this.classRegistrationId });
  }
}
