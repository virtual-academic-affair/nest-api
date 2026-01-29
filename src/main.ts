import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import './shared/utils/throw.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Connect gRPC microservice
  const config = app.get(ConfigService);
  const grpc = config.get('grpc') as MicroserviceOptions;
  app.connectMicroservice<MicroserviceOptions>(grpc);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.startAllMicroservices();
  await app.listen(3000);
  logger.log('Running on http://localhost:3000');
  logger.log(`gRPC server running on ${(grpc as any)?.options?.url ?? ''}`);
}

bootstrap();
