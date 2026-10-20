import { Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Experience } from '../experience/experience.model.js';
import { Loaders } from '../graphql/loaders.decorator.js';
import type { DataLoaders } from '../graphql/loaders.factory.js';
import { Skill } from '../skills/skill.model.js';
import { Profile } from './profile.model.js';
import { ProfileService } from './profile.service.js';
import { ProfileLink } from './profile-link.model.js';

@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Query(() => Profile)
  async profile(): Promise<Profile> {
    const profile = await this.profileService.getProfile();
    if (!profile) {
      throw new GraphQLError('Profile not found', {
        extensions: { code: 'NOT_FOUND' },
      });
    }
    return profile;
  }

  @ResolveField(() => [ProfileLink])
  links(
    @Parent() profile: Profile,
    @Loaders() loaders: DataLoaders,
  ): Promise<ProfileLink[]> {
    return loaders.linksByProfileId.load(profile.id);
  }

  @ResolveField(() => [Skill])
  skills(
    @Parent() profile: Profile,
    @Loaders() loaders: DataLoaders,
  ): Promise<Skill[]> {
    return loaders.skillsByProfileId.load(profile.id);
  }

  @ResolveField(() => [Experience])
  experience(
    @Parent() profile: Profile,
    @Loaders() loaders: DataLoaders,
  ): Promise<Experience[]> {
    return loaders.experienceByProfileId.load(profile.id);
  }
}
