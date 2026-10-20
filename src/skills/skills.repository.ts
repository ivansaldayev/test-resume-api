import { Injectable } from '@nestjs/common';
import type { Skill } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SkillsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByProfileIds(profileIds: number[]): Promise<Skill[]> {
    return this.prisma.skill.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  findByExperienceIds(
    experienceIds: number[],
  ): Promise<{ experienceId: number; skill: Skill }[]> {
    return this.prisma.experienceSkill.findMany({
      where: { experienceId: { in: experienceIds } },
      orderBy: [{ sortOrder: 'asc' }, { skillId: 'asc' }],
      select: { experienceId: true, skill: true },
    });
  }
}
