import { UnauthorizedException } from '@nestjs/common';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/decorators/roles.decorator';

export const COHORT_BASE_YEAR = 2000;

export type domainsByRole = Partial<Record<Role, string[]>>;
export type RoleDomains = domainsByRole;

export const resolveEmail = (email: string, domainsByRole: domainsByRole): Pick<User, 'role' | 'profile'> => {
  const [localPart, domain] = email.split('@');
  throwUnless(localPart && domain, new UnauthorizedException('Invalid email format'));

  const role = Object.entries(domainsByRole).find(([, domains]) => domains?.includes(domain))?.[0] as Role;
  throwUnless(role, new UnauthorizedException('Email domain is not allowed'));

  if (role === Role.Student) {
    const cohort = localPart?.match(/^\d{2}/)?.[0];
    throwUnless(cohort, new UnauthorizedException('Student email must include enrollment year'));
    return { role, profile: { enrollmentYear: parseInt(cohort) + COHORT_BASE_YEAR } };
  }
  return { role };
};
