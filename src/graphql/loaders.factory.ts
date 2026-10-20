import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { ProfileService } from '../profile/profile.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { groupByKey } from './group-by-key.js';

@Injectable()
export class LoadersFactory {
  constructor(
    private readonly profileService: ProfileService,
    private readonly skillsService: SkillsService,
  ) {}

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
      skillsByProfileId: new DataLoader(
        async (profileIds: readonly number[]) => {
          const skills = await this.skillsService.getByProfileIds([
            ...profileIds,
          ]);
          return groupByKey(profileIds, skills, (skill) => skill.profileId);
        },
      ),
    };
  }
}

export type DataLoaders = ReturnType<LoadersFactory['create']>;
