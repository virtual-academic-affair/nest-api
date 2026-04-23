import { IsArray, IsOptional, IsString } from 'class-validator';
import { Role } from '@authentication/enums/role.enum';

export class AuthEmailDomainsSettingDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  [Role.Student]?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  [Role.Admin]?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  [Role.Lecture]?: string[];
}
