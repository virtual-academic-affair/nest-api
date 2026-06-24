import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiResponseInterceptor } from '@zabih-dev/nest-api-response';
import { Observable } from 'rxjs';

@Injectable()
export class HttpResponseInterceptor implements NestInterceptor {
  private readonly apiResponseInterceptor: ApiResponseInterceptor;

  constructor(reflector: Reflector) {
    this.apiResponseInterceptor = new ApiResponseInterceptor(reflector);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const path = request.url || '';

    // Skip intercepting for logout to prevent crash with native objects (TCPWrap)
    if (path.includes('/logout')) {
      return next.handle();
    }

    return this.apiResponseInterceptor.intercept(context, next);
  }
}
