import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { getActiveUser } from '@authentication/decorators/active-user.decorator';
import { ROLES_KEY } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!contextRoles) {
      return true;
    }

    const currentRole = getActiveUser('role', context) as string;

    const hasRole = contextRoles.some((role) => currentRole === role);
    throwUnless(hasRole, new ForbiddenException('Forbidden resource'));

    return true;
  }
}
