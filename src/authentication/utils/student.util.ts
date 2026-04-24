import { UnauthorizedException } from '@nestjs/common';
import { Role } from '@authentication/decorators/roles.decorator';

export type RoleDomains = Partial<Record<Role, string[]>>;
export const COHORT_BASE_YEAR = 2000;
export type EmailLocalPart = {
  nameSlug: string;
  cohort: number;
  sequence: number;
  namePattern: string;
};

export function email2Role(email: string, domainsByRole: RoleDomains): Role {
  const [localPart, domain] = email.split('@');
  throwUnless(localPart && domain, new UnauthorizedException('Invalid email format'));

  const role = Object.entries(domainsByRole).find(([, domains]) => domains?.includes(domain))?.[0] as Role;
  throwUnless(role, new UnauthorizedException('Email domain is not allowed'));

  return role;
}

// Nguyễn Văn An has "nvan221@domain.com" -> { nameSlug: 'nvan', cohort: '22', sequence: 1, namePattern: 'N% V% An' }
export function email2Parts(email: string): EmailLocalPart | null {
  const match = email.split('@')[0].match(/^([a-z]+)(\d{2})(\d*)$/);

  return {
    nameSlug: match[1],
    cohort: Number(match[2]),
    sequence: Number(match[3] || 1),
    namePattern:
      match[1]
        .slice(0, -2)
        .split('')
        .map((c) => `${c.toUpperCase()}%`)
        .join(' ') + ` ${match[1].slice(-2).charAt(0).toUpperCase()}${match[1].slice(-1)}`,
  };
}

export function studentCode2EnrollmentYear(studentCode: string): number {
  return cohort2EnrollmentYear(Number(studentCode.slice(0, 2)));
}

export function cohort2EnrollmentYear(cohort: number): number {
  return cohort + COHORT_BASE_YEAR;
}
