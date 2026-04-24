import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateDto as CreateItemDto } from '@class-registration/dtos/class-registration-items/resource.dto';
import { BelongsToMessageCreateDto, BelongsToMessageQueryDto } from '@email/dtos/messages/related-message.dto';

export class QueryDto extends BelongsToMessageQueryDto {}

export class CreateDto extends BelongsToMessageCreateDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}

export class UpdateDto extends PartialType(OmitType(CreateDto, ['messageId', 'items'] as const)) {}

export const ResourceDto = {
  query: QueryDto,
  create: CreateDto,
  update: UpdateDto,
};
