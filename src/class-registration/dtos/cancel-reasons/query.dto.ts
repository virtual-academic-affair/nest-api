import { IsOptional } from 'class-validator';
import { IsBooleanQuery } from '@shared/decorators/is-boolean-query.decorator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsBooleanQuery()
  isActive: boolean;
}
