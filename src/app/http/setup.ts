import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HttpAppModule } from './http-app.module';

export async function setupHttpApp(port?: number): Promise<{
  app: INestApplication;
  port: number;
  url: string;
}> {
  const app = await NestFactory.create(HttpAppModule);
  app.enableCors();

  const HTTP_PORT = port || Number(process.env.HTTP_PORT) || 3000;
  const url = `http://localhost:${HTTP_PORT}`;

  return { app, port: HTTP_PORT, url };
}
