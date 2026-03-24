import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ApiExceptionFilter } from '@zabih-dev/nest-api-response/dist/api.exception';
import { Observable, throwError } from 'rxjs';

const httpToGrpcStatus: Record<number, GrpcStatus> = {
  [HttpStatus.BAD_REQUEST]: GrpcStatus.INVALID_ARGUMENT,
  [HttpStatus.UNAUTHORIZED]: GrpcStatus.UNAUTHENTICATED,
  [HttpStatus.FORBIDDEN]: GrpcStatus.PERMISSION_DENIED,
  [HttpStatus.NOT_FOUND]: GrpcStatus.NOT_FOUND,
  [HttpStatus.CONFLICT]: GrpcStatus.ALREADY_EXISTS,
  [HttpStatus.GONE]: GrpcStatus.NOT_FOUND,
  [HttpStatus.UNPROCESSABLE_ENTITY]: GrpcStatus.INVALID_ARGUMENT,
  [HttpStatus.TOO_MANY_REQUESTS]: GrpcStatus.RESOURCE_EXHAUSTED,
  [HttpStatus.INTERNAL_SERVER_ERROR]: GrpcStatus.INTERNAL,
  [HttpStatus.NOT_IMPLEMENTED]: GrpcStatus.UNIMPLEMENTED,
  [HttpStatus.BAD_GATEWAY]: GrpcStatus.UNAVAILABLE,
  [HttpStatus.SERVICE_UNAVAILABLE]: GrpcStatus.UNAVAILABLE,
  [HttpStatus.GATEWAY_TIMEOUT]: GrpcStatus.DEADLINE_EXCEEDED,
};

@Catch()
@Injectable()
export class UnifiedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnifiedExceptionFilter.name);
  private readonly httpExceptionFilter = new ApiExceptionFilter();

  catch(exception: any, host: ArgumentsHost): void | Observable<any> {
    if (host.getType() === 'rpc') {
      return this.handleGrpcException(exception, host);
    }

    // HTTP: delegate to the library's ApiExceptionFilter
    return this.httpExceptionFilter.catch(exception, host);
  }

  private handleGrpcException(exception: any, _host: ArgumentsHost): Observable<any> {
    const { code, message } = this.resolveGrpcError(exception);
    this.logger.error(`[gRPC Error] Code: ${code} | Message: ${message}`);
    return throwError(() => ({ code, message }));
  }

  private resolveGrpcError(exception: any): { code: GrpcStatus; message: string } {
    if (!exception) {
      return {
        code: GrpcStatus.INTERNAL,
        message: 'Internal server error (Unknown exception)',
      };
    }

    if (exception instanceof RpcException) {
      const error = exception.getError();
      return typeof error === 'object'
        ? { code: (error as any).code ?? GrpcStatus.UNKNOWN, message: (error as any).message ?? 'Unknown Rpc Error' }
        : { code: GrpcStatus.UNKNOWN, message: String(error) };
    }

    if (exception instanceof HttpException) {
      const httpStatus = exception.getStatus();
      const response = exception.getResponse() as any;

      const message = Array.isArray(response?.message)
        ? response.message.join(', ')
        : response?.message || response?.error || exception.message;

      return { code: httpToGrpcStatus[httpStatus] ?? GrpcStatus.UNKNOWN, message };
    }

    if (exception?.constructor?.name === 'EntityNotFoundError') {
      return { code: GrpcStatus.NOT_FOUND, message: exception.message };
    }

    return { code: GrpcStatus.INTERNAL, message: exception instanceof Error ? exception.message : String(exception) };
  }
}
