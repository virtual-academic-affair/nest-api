import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateDto } from '@task/dtos/task-items/create.dto';

export class UpdateDto extends PartialType(CreateDto) {
  @IsBoolean()
  @IsOptional()
  isChecked?: boolean;
}
