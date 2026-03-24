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

    return this.apiResponseInterceptor.intercept(context, next);
  }
}
