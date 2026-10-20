import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { ProfileService } from '../profile/profile.service.js';
import { groupByKey } from './group-by-key.js';

@Injectable()
export class LoadersFactory {
  constructor(private readonly profileService: ProfileService) {}

  create() {
    return {
      linksByProfileId: new DataLoader(
        async (profileIds: readonly number[]) => {
          const links = await this.profileService.getLinksByProfileIds([
            ...profileIds,
          ]);
          return groupByKey(profileIds, links, (link) => link.profileId);
        },
      ),
    };
  }
}

export type DataLoaders = ReturnType<LoadersFactory['create']>;
