import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@authentication/enums/role.enum';
import { ROLES_KEY } from '@authentication/decorators/roles.decorator';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';
import { REQUEST_USER_KEY } from '@authentication/guards/access-token.guard';

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

    const user: ActiveUserData = context.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];

    const hasRole = contextRoles.some((role) => user.role === role);
    throwUnless(hasRole, new ForbiddenException('Forbidden resource'));

    return true;
  }
}
