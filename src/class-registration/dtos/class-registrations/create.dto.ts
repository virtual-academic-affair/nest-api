import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateDto as CreateItemDto } from '@class-registration/dtos/class-registration-items/create.dto';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';

export class CreateDto extends PartialType(HasMessageIdDto) {
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @IsNumber()
  academicYear?: number;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}
