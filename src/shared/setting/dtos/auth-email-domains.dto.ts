import { IsArray, IsOptional, IsString } from 'class-validator';
import { Role } from '@authentication/enums/role.enum';

export class AuthEmailDomainsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  [Role.Student]?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  [Role.Lecture]?: string[];
}
