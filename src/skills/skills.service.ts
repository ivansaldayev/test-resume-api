import { Injectable } from '@nestjs/common';
import { SkillsRepository } from './skills.repository.js';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  getByProfileIds(profileIds: number[]) {
    return this.skillsRepository.findByProfileIds(profileIds);
  }

  getByExperienceIds(experienceIds: number[]) {
    return this.skillsRepository.findByExperienceIds(experienceIds);
  }

  getByProjectIds(projectIds: number[]) {
    return this.skillsRepository.findByProjectIds(projectIds);
  }
}
