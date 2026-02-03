import { INestApplication, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GrpcExceptionFilter } from '@shared/filters/grpc-exception.filter';
import '@shared/utils/throw.util';
import { AppModule } from './app.module';
import { HttpAppModule } from './http-app.module';

async function setupHttpApp(): Promise<INestApplication> {
  const app = await NestFactory.create(HttpAppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  return app;
}

async function setupGrpcApp(
  config: ConfigService
): Promise<{ app: any; url: string }> {
  const grpcConfig = config.get<MicroserviceOptions>('grpc');
  const grpcApp = await NestFactory.createMicroservice(AppModule, grpcConfig);
  grpcApp.useGlobalFilters(new GrpcExceptionFilter());
  grpcApp.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true })
  );
  const grpcUrl = (grpcConfig as any)?.options?.url;
  return { app: grpcApp, url: grpcUrl };
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const HTTP_PORT = process.env.HTTP_PORT || 3000;

  try {
    // Setup HTTP application
    const httpApp = await setupHttpApp();
    const config = httpApp.get(ConfigService);

    // Setup gRPC microservice
    const { app: grpcApp, url: grpcUrl } = await setupGrpcApp(config);

    // Start both applications
    await grpcApp.listen();
    await httpApp.listen(HTTP_PORT);

    logger.log(`HTTP server running on http://localhost:${HTTP_PORT}`);
    logger.log(`gRPC server running on ${grpcUrl}`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
