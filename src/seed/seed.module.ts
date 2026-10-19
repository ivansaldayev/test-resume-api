import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/app-config.module.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { SeedService } from './seed.service.js';

@Module({
  imports: [AppConfigModule, PrismaModule],
  providers: [SeedService],
})
export class SeedModule {}
