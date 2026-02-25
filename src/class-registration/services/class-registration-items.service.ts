import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Request as TRequest } from 'express';
import { Repository } from 'typeorm';
import { ClassRegistrationItem } from '@class-registration/entities/class-registration-item.entity';
import { ResourceItemService } from '@shared/resource/services/resource-item.service';

@Injectable({ scope: Scope.REQUEST })
export class ClassRegistrationItemsService extends ResourceItemService<ClassRegistrationItem> {
  protected searchableColumns = ['subjectName', 'subjectCode', 'className'];
  protected orderableColumns = ['id', 'subjectName', 'action', 'status'];

  constructor(
    @InjectRepository(ClassRegistrationItem) repository: Repository<ClassRegistrationItem>,
    @Inject(REQUEST) request: TRequest,
  ) {
    super(repository, request);
  }
}
