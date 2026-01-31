import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import '@shared/utils/throw.util';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Connect microservice
  const config = app.get(ConfigService);
  const grpc = config.get<MicroserviceOptions>('grpc');
  app.connectMicroservice<MicroserviceOptions>(grpc);
  const rmq = config.get<MicroserviceOptions>('rabbitmq');
  app.connectMicroservice<MicroserviceOptions>(rmq);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.startAllMicroservices();
  await app.listen(3000);
  logger.log('Running on http://localhost:3000');
  logger.log(`gRPC running on ${(grpc as any)?.options?.url ?? ''}`);
  logger.log(`RabbitMQ running on ${(rmq as any)?.options?.urls?.[0] ?? ''}`);
}

bootstrap();
