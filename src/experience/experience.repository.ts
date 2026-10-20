import { Injectable } from '@nestjs/common';
import type { Experience } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ExperienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: number[]): Promise<Experience[]> {
    return this.prisma.experience.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    });
  }
}
