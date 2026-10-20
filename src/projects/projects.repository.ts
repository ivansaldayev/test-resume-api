import { Injectable } from '@nestjs/common';
import type { Project } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProjectsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: number[]): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }
}
