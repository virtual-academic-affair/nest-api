import { Type } from 'class-transformer';
import { ArrayUnique, IsArray, IsEnum, IsInt, IsOptional, Min, IsBoolean } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class UpdateLabelsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  messageId?: number;

  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  systemLabels!: SystemLabel[];

  @IsOptional()
  @IsBoolean()
  deleteTasks?: boolean;
}
