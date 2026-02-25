import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDefined, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateDto as CreateItemDto } from '@class-registration/dtos/class-registration-items/create.dto';
import { HasMessageIdDto } from '@email/dtos/messages/has-message-id.dto';

export class CreateDto extends PartialType(HasMessageIdDto) {
  @IsString()
  @IsDefined()
  studentCode: string;

  @IsOptional()
  @IsNumber()
  academicYear?: number;

  @IsOptional()
  @IsString()
  studentName?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateItemDto)
  items: CreateItemDto[];
}
