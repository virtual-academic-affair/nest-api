import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';
import { EmailDomainsByRole } from '@authentication/types/email-domains-by-role.type';
import { UnauthorizedException } from '@nestjs/common';

const COHORT_BASE_YEAR = 2000;
const DEFAULT_EMAIL_DOMAINS_BY_ROLE: EmailDomainsByRole = { [Role.Student]: ['hcmus.edu.vn'] };

export const normalizeEmailDomainsByRole = (value: unknown): EmailDomainsByRole => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return DEFAULT_EMAIL_DOMAINS_BY_ROLE;
  }

  const parsed = Object.entries(value as Record<string, unknown>).map(([role, domains]) => [
    String(role).toLowerCase(),
    Array.isArray(domains) ? domains.map((domain) => String(domain).toLowerCase()) : [],
  ]);

  return Object.fromEntries(parsed) as EmailDomainsByRole;
};

export const resolveEmail = (email: string, emailDomainsByRole: EmailDomainsByRole): Pick<User, 'role' | 'profile'> => {
  const [localPart, domain] = (email || '').toLowerCase().split('@');
  throwUnless(localPart && domain, new UnauthorizedException('Invalid email format'));

  const role = (Object.entries(emailDomainsByRole).find(([, domains]) => domains?.includes(domain))?.[0] ??
    null) as Role | null;
  throwUnless(role, new UnauthorizedException('Email domain is not allowed'));

  if (role === Role.Student) {
    const enrollmentYear = resolveStudentEnrollmentYearFromEmail(email);
    throwUnless(enrollmentYear, new UnauthorizedException('Student email must include cohort digits'));
    return {
      role,
      profile: { enrollmentYear },
    };
  }

  return { role };
};

export const resolveStudentEnrollmentYearFromEmail = (email: string): number | null => {
  const localPart = (email || '').toLowerCase().split('@')[0];
  const cohort = localPart?.match(/^\d{2}/)?.[0];
  return cohort ? COHORT_BASE_YEAR + parseInt(cohort, 10) : null;
};
