import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import type { Env } from './config/env.schema.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  const port = config.get('PORT', { infer: true });

  await app.listen(port);

  new Logger('Bootstrap').log(`Application is listening on port ${port}`);
}
await bootstrap();
