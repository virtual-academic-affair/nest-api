import { IsEnum, IsOptional } from 'class-validator';
import { Role } from '@authentication/enums/role.enum';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';

export class QueryDto extends ResourceQueryDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
