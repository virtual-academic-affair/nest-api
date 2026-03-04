import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';
import { MessageResourceQueryDto } from '@shared/resource/dtos/message-resource-query.dto';

export class QueryDto extends MessageResourceQueryDto {
  @IsOptional()
  @IsString()
  studentCode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  academicYear?: number;

  @IsOptional()
  @IsBoolean()
  smartOrder?: boolean;
}
