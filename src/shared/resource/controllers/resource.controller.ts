import { Body, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ObjectLiteral } from 'typeorm';
import { validateDto } from '@shared/resource/utils/validate-dto.util';
import { ResourceService } from '../services/resource.service';

export abstract class ResourceController<T extends ObjectLiteral> {
  protected constructor(protected readonly service: ResourceService<T>) {}

  protected abstract getDtoClasses(): {
    query?: new () => unknown;
    create?: new () => unknown;
    update?: new () => unknown;
  };

  protected async dto<TDto>(key: 'query' | 'create' | 'update', data: unknown): Promise<TDto> {
    const DtoClass = this.getDtoClasses()[key] as new () => TDto;
    return validateDto(DtoClass, data, key !== 'query');
  }

  @Get()
  async findAll(@Query() dto: unknown) {
    return this.service.findAll(await this.dto('query', dto));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(+id);
  }

  @Post()
  async create(@Body() dto: unknown) {
    return this.service.create(await this.dto('create', dto));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: unknown) {
    return this.service.update(+id, await this.dto('update', dto));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(+id);
  }
}
