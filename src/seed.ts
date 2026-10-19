import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedModule } from './seed/seed.module.js';
import { SeedService } from './seed/seed.service.js';

const logger = new Logger('Seed');

try {
  const app = await NestFactory.createApplicationContext(SeedModule);
  await app.get(SeedService).run();
  await app.close();
} catch (error) {
  logger.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
