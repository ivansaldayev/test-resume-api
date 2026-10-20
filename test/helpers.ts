import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { inject } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

export async function createApp(): Promise<INestApplication> {
  if (process.env.DATABASE_URL !== inject('databaseUrl')) {
    throw new Error('Run e2e tests with: npm run test:e2e');
  }

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  await app.init();
  return app;
}

export async function resetDatabase(app: INestApplication): Promise<void> {
  await app.get(PrismaService)
    .$executeRaw`TRUNCATE profiles RESTART IDENTITY CASCADE`;
}

export function graphql(app: INestApplication, query: string) {
  return request(app.getHttpServer()).post('/graphql').send({ query });
}
