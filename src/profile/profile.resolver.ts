import { Query, Resolver } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Profile } from './profile.model.js';
import { ProfileService } from './profile.service.js';

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
}
