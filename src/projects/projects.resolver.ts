import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Loaders } from '../graphql/loaders.decorator.js';
import type { DataLoaders } from '../graphql/loaders.factory.js';
import { Skill } from '../skills/skill.model.js';
import { Project } from './project.model.js';

@Resolver(() => Project)
export class ProjectsResolver {
  @ResolveField(() => [Skill])
  skills(
    @Parent() project: Project,
    @Loaders() loaders: DataLoaders,
  ): Promise<Skill[]> {
    return loaders.skillsByProjectId.load(project.id);
  }
}
