import { Module } from '@nestjs/common';
import { ExperienceModule } from '../experience/experience.module.js';
import { ProfileModule } from '../profile/profile.module.js';
import { ProjectsModule } from '../projects/projects.module.js';
import { SkillsModule } from '../skills/skills.module.js';
import { LoadersFactory } from './loaders.factory.js';

@Module({
  imports: [ProfileModule, SkillsModule, ExperienceModule, ProjectsModule],
  providers: [LoadersFactory],
  exports: [LoadersFactory],
})
export class LoadersModule {}
