import { Injectable } from '@nestjs/common';
import DataLoader from 'dataloader';
import { ExperienceService } from '../experience/experience.service.js';
import { ProfileService } from '../profile/profile.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { SkillsService } from '../skills/skills.service.js';
import { groupByKey } from './group-by-key.js';

@Injectable()
export class LoadersFactory {
  constructor(
    private readonly profileService: ProfileService,
    private readonly skillsService: SkillsService,
    private readonly experienceService: ExperienceService,
    private readonly projectsService: ProjectsService,
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
      experienceByProfileId: new DataLoader(
        async (profileIds: readonly number[]) => {
          const experience = await this.experienceService.getByProfileIds([
            ...profileIds,
          ]);
          return groupByKey(profileIds, experience, (item) => item.profileId);
        },
      ),
      skillsByExperienceId: new DataLoader(
        async (experienceIds: readonly number[]) => {
          const rows = await this.skillsService.getByExperienceIds([
            ...experienceIds,
          ]);
          return groupByKey(experienceIds, rows, (row) => row.experienceId).map(
            (group) => group.map((row) => row.skill),
          );
        },
      ),
      projectsByProfileId: new DataLoader(
        async (profileIds: readonly number[]) => {
          const projects = await this.projectsService.getByProfileIds([
            ...profileIds,
          ]);
          return groupByKey(
            profileIds,
            projects,
            (project) => project.profileId,
          );
        },
      ),
      skillsByProjectId: new DataLoader(
        async (projectIds: readonly number[]) => {
          const rows = await this.skillsService.getByProjectIds([
            ...projectIds,
          ]);
          return groupByKey(projectIds, rows, (row) => row.projectId).map(
            (group) => group.map((row) => row.skill),
          );
        },
      ),
    };
  }
}

export type DataLoaders = ReturnType<LoadersFactory['create']>;
