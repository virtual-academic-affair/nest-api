import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {}

export class CreateDto {
  @IsString()
  documentType: string;

  @IsString()
  contentLink: string;

  @IsOptional()
  @IsString()
  linkDisplayName?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateDto extends PartialType(CreateDto) {}

export const ResourceDto = {
  query: QueryDto,
  create: CreateDto,
  update: UpdateDto,
};
