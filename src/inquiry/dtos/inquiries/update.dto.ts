import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateDto } from './create.dto';

export class UpdateDto extends PartialType(CreateDto) {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  answer?: string;
}
