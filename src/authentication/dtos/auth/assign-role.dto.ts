import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '@authentication/decorators/roles.decorator';

export class AssignRoleDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}
