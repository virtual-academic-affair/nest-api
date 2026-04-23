import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@authentication/entities/user.entity';
import { Role } from '@authentication/enums/role.enum';

export const ActiveUser = createParamDecorator((field: keyof User | undefined, ctx: ExecutionContext) =>
  getActiveUser(field, ctx),
);

export function getActiveUser(field: keyof User | undefined, ctx: ExecutionContext): unknown {
  let user: Partial<User> | undefined;

  if (ctx.getType() === 'rpc') {
    const metadata = ctx.switchToRpc().getContext();
    user = {
      id: +metadata?.get?.('x-user-id')?.[0] || 0,
      email: metadata?.get?.('x-user-email')?.[0] ?? 'system@gmail.com',
      role: metadata?.get?.('x-user-role')?.[0] ?? Role.Admin,
    };
  } else {
    const request = ctx.switchToHttp().getRequest();
    user = request.user;
  }

  return field ? user?.[field] : user;
}
