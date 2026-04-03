import { UnauthorizedException } from '@nestjs/common';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';

/**
 * Resolves email into User Fields.
 * Logic:
 * - Domain @clc.fitus.edu.vn required.
 * - ≥ 2 tail digits: Student (with cohort/enrollmentYear).
 * - Else: Lecture (no profile).
 */
export const resolveEmail = (email: string): Pick<User, 'role' | 'profile'> => {
  const match = email.match(/^([^0-9]+)(\d*)@clc\.fitus\.edu\.vn$/);
  throwUnless(match, new UnauthorizedException('Email must be end with @clc.fitus.edu.vn'));

  const digits = match[2];
  if (digits.length >= 2) {
    const cohort = digits.slice(0, 2);
    return { role: Role.Student, profile: { cohort: `K${cohort}`, enrollmentYear: 2000 + +cohort } };
  }

  return { role: Role.Lecture };
};
