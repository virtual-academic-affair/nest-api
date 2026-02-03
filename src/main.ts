import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GrpcExceptionFilter } from '@shared/filters/grpc-exception.filter';
import '@shared/utils/throw.util';
import { AppModule } from './app.module';
import { HttpAppModule } from './http-app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(HttpAppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe());

  // Microservice (gRPC)
  const config = app.get(ConfigService);
  const grpcConfig = config.get<MicroserviceOptions>('grpc');
  const grpcApp = await NestFactory.createMicroservice(AppModule, grpcConfig);
  grpcApp.useGlobalFilters(new GrpcExceptionFilter());
  grpcApp.useGlobalPipes(new ValidationPipe());

  await grpcApp.listen();
  await app.listen(3000);
  logger.log('Running on http://localhost:3000');
  logger.log(`gRPC running on ${(grpcConfig as any)?.options?.url ?? ''}`);
}

bootstrap();
