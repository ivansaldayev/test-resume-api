import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/app-config.module.js';
import { ExperienceModule } from './experience/experience.module.js';
import { AppGraphQLModule } from './graphql/app-graphql.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProfileModule } from './profile/profile.module.js';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    AppGraphQLModule,
    ProfileModule,
    ExperienceModule,
  ],
})
export class AppModule {}
