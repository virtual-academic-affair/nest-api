import { Injectable } from '@nestjs/common';
import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

@Injectable()
export abstract class ResourceService<T extends ObjectLiteral> {
  protected abstract repository: Repository<T>;

  protected abstract searchableColumns: string[];

  protected abstract orderableColumns: string[];

  protected get entityName(): string {
    return this.repository.metadata.tableName;
  }

  async findAll(queryDto: ResourceQueryDto) {
    const page = Math.max(queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit), 20);

    const { keyword, orderCol = 'id', orderDir = 'ASC' } = queryDto;
    const skip = (page - 1) * Math.min(limit, 20);

    const queryBuilder = this.repository.createQueryBuilder(this.entityName);

    if (keyword && this.searchableColumns.length > 0) {
      const conditions = this.searchableColumns
        .map((col) => `${this.entityName}.${col} LIKE :keyword`)
        .join(' OR ');
      queryBuilder.andWhere(`(${conditions})`, {
        keyword: `%${keyword}%`,
      });
    }

    this.applyCustomFilters(queryBuilder, queryDto);

    const orderColumn = this.orderableColumns.includes(orderCol)
      ? orderCol
      : 'id';
    const orderDirection = orderDir === 'DESC' ? 'DESC' : 'ASC';

    queryBuilder
      .orderBy(`${this.entityName}.${orderColumn}`, orderDirection)
      .skip(skip)
      .take(limit);

    const [items, total] = await queryBuilder.getManyAndCount();

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

  async findOne(id: number) {
    return await this.repository.findOneByOrFail({
      id: id as any,
    });
  }

  async create(createDto: object) {
    const entity = this.repository.create(createDto as any);
    return await this.repository.save(entity);
  }

  async update(id: number, updateDto: object) {
    const entity = await this.findOne(id);
    Object.assign(entity, updateDto);
    return await this.repository.save(entity);
  }

  async remove(id: number) {
    const entity = await this.findOne(id);
    return await this.repository.remove(entity);
  }

  protected applyCustomFilters(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryBuilder: SelectQueryBuilder<T>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    queryDto: ResourceQueryDto
  ): void {
    return;
  }
}
