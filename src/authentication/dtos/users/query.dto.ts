import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@authentication/enums/role.enum';
import { IsBooleanQuery } from '@shared/decorators/is-boolean-query.decorator';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @IsOptional()
  @IsBooleanQuery()
  isActive?: boolean;
}
