import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AUTHS_KEY, AuthType } from '@authentication/decorators/auth.decorator';
import { GrpcGuard } from '@authentication/guards/grpc.guard';
import { JwtGuard } from '@authentication/guards/jwt.guard';

@Injectable()
export class AuthsGuard implements CanActivate {
  private readonly authTypeToGuard: Partial<Record<AuthType, CanActivate>>;

  constructor(
    private readonly reflector: Reflector,
    private readonly grpcGuard: GrpcGuard,
    private readonly jwtGuard: JwtGuard,
  ) {
    this.authTypeToGuard = {
      [AuthType.Grpc]: this.grpcGuard,
      [AuthType.Jwt]: this.jwtGuard,
    };
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const auths = this.reflector.getAllAndOverride<AuthType[] | undefined>(AUTHS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!auths) {
      return true;
    }

    await this.assertAnyGuardAllows(context, auths);
    return true;
  }

  private async assertAnyGuardAllows(context: ExecutionContext, auths: AuthType[]): Promise<void> {
    let firstError: unknown = undefined;

    for (const auth of auths) {
      const guard = this.authTypeToGuard[auth];
      if (!guard) {
        continue;
      }

      try {
        const allowed = await guard.canActivate(context);
        if (allowed) {
          return;
        }
      } catch (err) {
        firstError ??= err;
      }
    }

    throw firstError ?? new UnauthorizedException();
  }
}
