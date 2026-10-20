import { Module } from '@nestjs/common';
import { ProfileModule } from '../profile/profile.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { LoadersFactory } from './loaders.factory.js';

@Module({
  imports: [ProfileModule, SkillsModule],
  providers: [LoadersFactory],
  exports: [LoadersFactory],
})
export class LoadersModule {}
