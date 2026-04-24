import { IsArray, IsOptional, IsString } from 'class-validator';
import { Role } from '@authentication/decorators/roles.decorator';

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
