import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '@authentication/guards/authentication.guard';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';

export const ActiveUser = createParamDecorator((field: keyof ActiveUserData | undefined, ctx: ExecutionContext) =>
  getActiveUser(field, ctx),
);

export function getActiveUser(
  field: keyof ActiveUserData | undefined,
  ctx: ExecutionContext,
): number | string | ActiveUserData {
  let user: ActiveUserData | undefined;

  if (ctx.getType() === 'rpc') {
    const metadata = ctx.switchToRpc().getContext();
    user = {
      sub: +metadata?.get?.('x-user-id')?.[0],
      email: metadata?.get?.('x-user-email')?.[0],
      role: metadata?.get?.('x-user-role')?.[0],
    } as ActiveUserData;
  } else {
    const request = ctx.switchToHttp().getRequest();
    user = request[REQUEST_USER_KEY];
  }

  return field ? user?.[field] : user;
}
