import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { AppModule } from '../app.module';
import { GrpcExceptionFilter } from './filters/grpc-exception.filter';
import { GrpcResponseInterceptor } from './interceptors/grpc-response.interceptor';

@Module({
  imports: [AppModule],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: GrpcResponseInterceptor },
    { provide: APP_FILTER, useClass: GrpcExceptionFilter },
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        transform: true,
        whitelist: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },
  ],
})
export class GrpcAppModule {}
