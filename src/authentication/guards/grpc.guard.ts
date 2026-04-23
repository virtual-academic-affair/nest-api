import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class GrpcGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    return context.getType() === 'rpc';
  }
}
