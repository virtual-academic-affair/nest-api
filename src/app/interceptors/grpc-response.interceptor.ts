import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class GrpcResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        return { success: true, ...data };
      }),
    );
  }
}
