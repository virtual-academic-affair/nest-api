import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import { webhookAdaptMiddleware } from '@email/middlewares/webhook-adapt.middleware';
import '@shared/utils/throw.util';
import { AppModule } from '@app/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
    app.enableCors({ origin: true, credentials: true });
    app.getHttpAdapter().getInstance().set('query parser', 'extended');
    app.use(webhookAdaptMiddleware);
    app.use(cookieParser());

    if (process.env.START_GRPC === 'true') {
      const config = app.get(ConfigService);
      const grpcConfig = config.get<MicroserviceOptions>('grpc');
      app.connectMicroservice<MicroserviceOptions>(grpcConfig, { inheritAppConfig: true });
    }

    await app.startAllMicroservices();

    const HTTP_PORT = Number(process.env.HTTP_PORT) || 3000;
    await app.listen(HTTP_PORT);
    logger.log(`HTTP server running on http://localhost:${HTTP_PORT}`);

    if (process.env.START_GRPC === 'true') {
      const config = app.get(ConfigService);
      const grpcUrl = config.get('grpc.options.url');
      logger.log(`gRPC server running on ${grpcUrl}`);
    }
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
