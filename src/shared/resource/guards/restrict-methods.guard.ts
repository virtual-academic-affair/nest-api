import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { RESTRICT_METHODS_KEY, RestrictMethodsOptions } from '../decorators/restrict-methods.decorator';

@Injectable()
export class RestrictMethodsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RestrictMethodsOptions>(RESTRICT_METHODS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const handler = context.getHandler();
    const methodName = handler.name as ResourceAction;

    if (!Object.values(ResourceAction).includes(methodName)) {
      return true;
    }

    if (options.only?.length) {
      return await this.checkAllow(methodName, options.only);
    }

    if (options.except?.length) {
      return await this.checkExcept(methodName, options.except);
    }

    return true;
  }

  private async checkAllow(current: ResourceAction, allowed: string[]): Promise<boolean> {
    throwUnless(allowed.includes(current), new ForbiddenException('Method not allowed'));
    return true;
  }

  private async checkExcept(current: ResourceAction, denied: string[]): Promise<boolean> {
    throwIf(denied.includes(current), new ForbiddenException('Method not allowed'));
    return true;
  }
}
