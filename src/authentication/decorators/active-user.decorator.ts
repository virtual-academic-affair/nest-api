import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_USER_KEY } from '@authentication/guards/access-token.guard';
import { ActiveUserData } from '@authentication/interfaces/active-user-data.interface';

export const ActiveUser = createParamDecorator(
  (field: keyof ActiveUserData | undefined, ctx: ExecutionContext) => {
    const user: ActiveUserData | undefined = ctx.switchToHttp().getRequest()[
      REQUEST_USER_KEY
    ];
    return field ? user?.[field] : user;
  }
);
