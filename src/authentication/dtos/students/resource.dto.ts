import { PartialType } from '@nestjs/mapped-types';
import { IsString } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {}

export class CreateDto {
  @IsString()
  studentCode: string;

  @IsString()
  studentName: string;
}

export class UpdateDto extends PartialType(CreateDto) {}

export const ResourceDto = {
  query: QueryDto,
  create: CreateDto,
  update: UpdateDto,
};
