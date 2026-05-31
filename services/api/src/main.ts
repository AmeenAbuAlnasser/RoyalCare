import 'tsconfig-paths/register';
import { NestFactory } from '@nestjs/core';
import { mkdirSync } from 'fs';
import { resolve } from 'path';
import { AppModule } from './app.module';
import {
  API_GLOBAL_PREFIX,
  DEFAULT_API_PORT,
} from './common/constants/api.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-royalcare-super-admin-user-id',
      'x-royalcare-super-admin-email',
      'x-royalcare-super-admin-name',
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Ensure branding upload dir exists before any request arrives.
  mkdirSync(
    resolve(
      process.cwd(),
      '..',
      '..',
      'apps',
      'web',
      'public',
      'uploads',
      'branding',
    ),
    { recursive: true },
  );

  await app.listen(process.env.PORT ?? DEFAULT_API_PORT);
}
void bootstrap();
