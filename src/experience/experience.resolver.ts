import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loaders } from '../graphql/loaders.decorator.js';
import type { DataLoaders } from '../graphql/loaders.factory.js';
import { Skill } from '../skills/skill.model.js';
import { Experience } from './experience.model.js';

@Resolver(() => Experience)
export class ExperienceResolver {
  @ResolveField(() => [Skill])
  skills(
    @Parent() experience: Experience,
    @Loaders() loaders: DataLoaders,
  ): Promise<Skill[]> {
    return loaders.skillsByExperienceId.load(experience.id);
  }
}
