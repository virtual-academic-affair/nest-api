import { CreateDto as CreateItemDto } from '@class-registration/dtos/class-registration-items/resource.dto';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { MessageResourceQueryDto } from '@shared/resource/dtos/message-resource-query.dto';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';

export class QueryDto extends MessageResourceQueryDto {
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cohort?: number;

  @IsOptional()
  @IsBoolean()
  smartOrder?: boolean;
}

export class CreateDto extends HasMessageIdDto {
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
