import { ArrayUnique, IsArray, IsEnum, IsOptional } from 'class-validator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';
import { SystemLabel } from '@shared/enums/system-label.enum';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  systemLabels?: SystemLabel[];
}
