import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { ProfilePatchDto } from '@authentication/dtos/users/update-profile.dto';
import { Role } from '@authentication/enums/role.enum';

export class UpdateDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfilePatchDto)
  profile?: ProfilePatchDto;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
