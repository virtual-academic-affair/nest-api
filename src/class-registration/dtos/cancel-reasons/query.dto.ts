import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive: boolean;
}
