import { Injectable } from '@nestjs/common';
import { ExperienceRepository } from './experience.repository.js';

@Injectable()
export class ExperienceService {
  constructor(private readonly experienceRepository: ExperienceRepository) {}

  getByProfileIds(profileIds: number[]) {
    return this.experienceRepository.findByProfileIds(profileIds);
  }
}
