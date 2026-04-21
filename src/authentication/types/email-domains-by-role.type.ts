import { Role } from '@authentication/enums/role.enum';

export type EmailDomainsByRole = Partial<Record<Role, string[]>>;
