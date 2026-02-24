import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GrpcAppModule } from './grpc-app.module';

export async function setupGrpcApp(config: ConfigService): Promise<{ app: any; url: string }> {
  const grpcConfig = config.get<MicroserviceOptions>('grpc');
  const grpcApp = await NestFactory.createMicroservice(GrpcAppModule, grpcConfig);
  return { app: grpcApp, url: (grpcConfig as any)?.options?.url };
}
