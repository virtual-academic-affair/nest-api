import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { HttpAppModule } from './http-app.module';

export async function setupHttpApp(port?: number): Promise<{ app: INestApplication; port: number; url: string }> {
  const app = await NestFactory.create(HttpAppModule);
  app.enableCors({ origin: true, credentials: true });
  app.getHttpAdapter().getInstance().set('query parser', 'extended');

  app.use(cookieParser());

  const HTTP_PORT = port || Number(process.env.HTTP_PORT) || 3000;
  const url = `http://localhost:${HTTP_PORT}`;

  return { app, port: HTTP_PORT, url };
}
