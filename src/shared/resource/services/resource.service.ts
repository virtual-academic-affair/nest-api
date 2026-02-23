import { Injectable } from '@nestjs/common';
import { Brackets, ILike, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export abstract class ResourceService<T extends ObjectLiteral> {
  protected readonly searchableColumns: string[] = [];
  protected readonly orderableColumns: string[] = ['createdAt', 'updatedAt'];

  protected constructor(protected readonly repository: Repository<T>) {}

  protected get entityName(): string {
    return this.repository.metadata.name;
  }

  async findAll(queryDto: ResourceQueryDto): Promise<PaginatedResult<T>> {
    const page = Math.max(queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit), 20);

    const { keyword, orderCol = 'id', orderDir = 'ASC' } = queryDto;
    const skip = (page - 1) * Math.min(limit, 20);

    const queryBuilder = this.repository.createQueryBuilder(this.entityName);
    this.withAll(queryBuilder);

    if (keyword && this.searchableColumns.length > 0) {
      new Brackets((qb) => this.searchableColumns.map((col) => qb.orWhere({ [col]: ILike(`%${keyword}%`) })));
    }

    this.applyCustomFilters(queryBuilder, queryDto);

    const orderColumn = this.orderableColumns.includes(orderCol) ? orderCol : 'id';
    const orderDirection = orderDir === 'DESC' ? 'DESC' : 'ASC';

    const [items, total] = await queryBuilder
      .orderBy(`${this.entityName}.${orderColumn}`, orderDirection)
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<T> {
    const queryBuilder = this.repository.createQueryBuilder(this.entityName);
    this.withOne(queryBuilder);

    return await queryBuilder.where(`${this.entityName}.id = :id`, { id }).getOneOrFail();
  }

  async create(createDto: object): Promise<T> {
    const entity = this.repository.create(createDto as any);
    return (await this.repository.save(entity)) as unknown as T;
  }

  async update(id: number, updateDto: object): Promise<T> {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return (await this.repository.save(entity as any)) as unknown as T;
  }

  async remove(id: number): Promise<T> {
    const entity = await this.findOne(id);
    return (await this.repository.remove(entity)) as unknown as T;
  }

  protected applyCustomFilters(_queryBuilder: SelectQueryBuilder<T>, _queryDto: ResourceQueryDto): void {}

  protected withAll(_queryBuilder: SelectQueryBuilder<T>): void {}

  protected withOne(_queryBuilder: SelectQueryBuilder<T>): void {}
}
