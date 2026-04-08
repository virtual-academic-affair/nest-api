import { ArrayUnique, IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { SystemLabel } from '@shared/enums/system-label.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(SystemLabel, { each: true })
  systemLabels?: SystemLabel[];

  @IsOptional()
  @IsString()
  gmailMessageId?: string;
}
