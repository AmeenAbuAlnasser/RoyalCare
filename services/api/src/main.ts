import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  API_GLOBAL_PREFIX,
  DEFAULT_API_PORT,
} from './common/constants/api.constants';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  await app.listen(process.env.PORT ?? DEFAULT_API_PORT);
}
void bootstrap();
