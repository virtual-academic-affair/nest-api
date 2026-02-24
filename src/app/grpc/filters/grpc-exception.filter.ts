import { status as GrpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
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
export class GrpcExceptionFilter extends BaseRpcExceptionFilter {
  private readonly logger = new Logger(GrpcExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    if (host.getType() !== 'rpc') {
      return;
    }

    const { code, message } = this.resolveError(exception);
    this.logger.error(`[gRPC Error] Code: ${code} | Message: ${message}`);
    return throwError(() => ({ code, message }));
  }

  private resolveError(exception: any): { code: GrpcStatus; message: string } {
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
