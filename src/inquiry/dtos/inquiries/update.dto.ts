import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateDto } from './create.dto';

export class UpdateDto extends PartialType(OmitType(CreateDto, ['messageId'] as const)) {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;
}
