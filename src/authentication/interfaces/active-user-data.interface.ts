import { Role } from '@authentication/enums/role.enum';

export interface ActiveUserData {
  sub: number;
  email: string;
  role: Role;
}
