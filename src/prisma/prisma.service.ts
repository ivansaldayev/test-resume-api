import {
  Injectable,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import type { Env } from '../config/env.schema.js';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(config: ConfigService<Env, true>) {
    super({
      adapter: new PrismaPg({
        connectionString: config.get('DATABASE_URL', { infer: true }),
        // pg waits forever by default.
        connectionTimeoutMillis: 5_000,
      }),
      log: [{ emit: 'event', level: 'query' }],
    });
  }

  async onModuleInit() {
    // The pg adapter connects lazily. Run a simple query so that the app
    // fails on startup if the database is not available.
    await this.$queryRaw`SELECT 1`;
  }

  // Runs after the HTTP server is closed, so active requests can finish.
  async onApplicationShutdown() {
    await this.$disconnect();
  }
}
