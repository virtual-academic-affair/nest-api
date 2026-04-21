import { Injectable } from '@nestjs/common';
import { Brackets, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
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
  protected readonly orderableColumns: string[] = [];
  protected readonly autoOrderableColumns: string[] = ['id', 'createdAt', 'updatedAt'];
  protected readonly alias: string;

  protected constructor(protected readonly repository: Repository<T>) {
    this.alias = this.repository.metadata.name;
  }

  protected p(column: keyof T | string): string {
    return `${this.alias}.${String(column)}`; // path
  }

  protected get queryBuilder(): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(this.alias);
  }

  async findAll(queryDto: ResourceQueryDto): Promise<PaginatedResult<T>> {
    const page = Math.max(queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit), 20);

    const { keyword, orderCol = 'id', orderDir = 'ASC' } = queryDto;
    const skip = (page - 1) * Math.min(limit, 20);

    const qb = this.queryBuilder;
    this.withAll(qb);

    if (keyword && this.searchableColumns.length > 0) {
      qb.andWhere(
        new Brackets((sub) => {
          const vector = this.searchableColumns
            .map((col) => `COALESCE(${this.p(col)}::text, '')`)
            .join(` || ' ' || `);
          sub.where(
            `to_tsvector('simple', ${vector}) @@ websearch_to_tsquery('simple', :keyword)`,
            { keyword: keyword.trim() },
          );
        }),
      );
    }

    this.applyCustomFilters(qb, queryDto);

    const orderColumn =
      this.orderableColumns.includes(orderCol) || this.autoOrderableColumns.includes(orderCol)
        ? orderCol
        : this.autoOrderableColumns[0];

    const [items, total] = await qb
      .addOrderBy(this.p(orderColumn), orderDir === 'DESC' ? 'DESC' : 'ASC')
      .addOrderBy(this.p('createdAt'), 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { items, pagination: { total, currentPage: page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: number): Promise<T> {
    const qb = this.queryBuilder.where({ id });
    this.withOne(qb);

    return await qb.getOneOrFail();
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
