import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ProfilePatchDto, UpdateProfileDto } from '@authentication/dtos/users/update-profile.dto';
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

export class UpdateDto extends UpdateProfileDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export const ResourceDto = {
  query: QueryDto,
  update: UpdateDto,
};
