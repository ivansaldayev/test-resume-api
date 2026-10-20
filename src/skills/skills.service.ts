import { Injectable } from '@nestjs/common';
import { SkillsRepository } from './skills.repository.js';

@Injectable()
export class SkillsService {
  constructor(private readonly skillsRepository: SkillsRepository) {}

  getByProfileIds(profileIds: number[]) {
    return this.skillsRepository.findByProfileIds(profileIds);
  }
}
