import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable({ scope: Scope.REQUEST })
export abstract class ResourceItemService<T> extends ResourceService<T> {
  protected readonly parentId: number;

  protected constructor(
    protected readonly repository: Repository<T>,
    @Inject(REQUEST) protected readonly request: Request,
  ) {
    super(repository);
    this.parentId = +this.request.params?.parentId || 0;
  }

  protected get queryBuilder(): SelectQueryBuilder<T> {
    return super.queryBuilder.andWhere({ ...(this.parentId ? { parentId: this.parentId } : {}) });
  }

  async create(createDto: any): Promise<T> {
    return await super.create({ ...createDto, parentId: this.parentId });
  }
}
