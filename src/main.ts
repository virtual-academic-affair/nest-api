import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import '@shared/utils/throw.util';
import { setupGrpcApp } from './app/grpc/setup';
import { setupHttpApp } from './app/http/setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    const { app: httpApp, port: httpPort, url: httpUrl } = await setupHttpApp();
    await httpApp.listen(httpPort);
    logger.log(`HTTP server running on ${httpUrl}`);

    if (process.env.START_GRPC === 'true') {
      const config = httpApp.get(ConfigService);
      const { app: grpcApp, url: grpcUrl } = await setupGrpcApp(config);
      await grpcApp.listen();
      logger.log(`gRPC server running on ${grpcUrl}`);
    }
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

bootstrap();
