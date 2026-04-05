import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';
import { UnauthorizedException } from '@nestjs/common';

const DOMAIN = 'clc.fitus.edu.vn';
const COHORT_BASE_YEAR = 2000;

export const resolveEmail = (email: string): Pick<User, 'role' | 'profile'> => {
  throwUnless(email?.endsWith(`@${DOMAIN}`), new UnauthorizedException(`Email must belong to the ${DOMAIN} domain`));

  const emailRegex = new RegExp(`^([^0-9]+)(\\d*)@${DOMAIN.replace(/\./g, '\\.')}$`);
  const match = email.match(emailRegex);
  throwUnless(match, new UnauthorizedException('Invalid email format structure'));

  const [, , digits] = match;
  const isStudent = digits.length >= 2;

  return isStudent
    ? {
        role: Role.Student,
        profile: { enrollmentYear: COHORT_BASE_YEAR + parseInt(digits.slice(0, 2), 10) },
      }
    : { role: Role.Lecture };
};
