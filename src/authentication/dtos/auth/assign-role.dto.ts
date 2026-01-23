import { IsEmail, IsEnum } from 'class-validator';
import { Role } from '@authentication/enums/role.enum';

export class AssignRoleDto {
  @IsEmail()
  email: string;

  @IsEnum(Role)
  role: Role;
}
