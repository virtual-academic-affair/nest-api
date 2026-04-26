import { IsArray, IsOptional, IsString } from 'class-validator';
import { Role } from '@authentication/decorators/roles.decorator';

export class AuthRoleDomainsDto {
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
