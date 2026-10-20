import { Injectable } from '@nestjs/common';
import { ProjectsRepository } from './projects.repository.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly projectsRepository: ProjectsRepository) {}

  getByProfileIds(profileIds: number[]) {
    return this.projectsRepository.findByProfileIds(profileIds);
  }
}
