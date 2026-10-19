import { Injectable, Logger } from '@nestjs/common';
import { z } from 'zod';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import profileData from './profile.json' with { type: 'json' };
import { type SeedData, seedSchema } from './seed.schema.js';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async run(): Promise<void> {
    const data = this.parse(profileData);
    const { slug } = data.profile;

    // One transaction: the database is filled completely or not at all.
    // So "the profile exists" means "the seed is done".
    const seeded = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.profile.findUnique({
        where: { slug },
        select: { id: true },
      });
      if (existing) {
        return false;
      }

      await this.insert(tx, data);
      return true;
    });

    if (seeded) {
      this.logger.log(
        `Profile "${slug}" created: ${data.skills.length} skills, ` +
          `${data.experience.length} experience items, ` +
          `${data.projects.length} projects`,
      );
    } else {
      this.logger.log(`Profile "${slug}" already exists, nothing to do`);
    }
  }

  private parse(input: unknown): SeedData {
    const result = seedSchema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid seed data:\n${z.prettifyError(result.error)}`);
    }
    return result.data;
  }

  private async insert(
    tx: Prisma.TransactionClient,
    data: SeedData,
  ): Promise<void> {
    const { links, ...profile } = data.profile;

    const { id: profileId } = await tx.profile.create({
      data: {
        ...profile,
        links: {
          create: links.map((link, index) => ({ ...link, sortOrder: index })),
        },
      },
      select: { id: true },
    });

    const skills = await tx.skill.createManyAndReturn({
      data: data.skills.map((skill, index) => ({
        ...skill,
        profileId,
        sortOrder: index,
      })),
      select: { id: true, name: true },
    });
    const skillIds = new Map(skills.map((skill) => [skill.name, skill.id]));

    const skillLinks = (names: string[]) =>
      names.map((name, index) => {
        const skillId = skillIds.get(name);
        if (skillId === undefined) {
          throw new Error(`Unknown skill "${name}"`);
        }
        return { skillId, sortOrder: index };
      });

    for (const { skills: names, ...experience } of data.experience) {
      await tx.experience.create({
        data: {
          ...experience,
          profileId,
          skills: { create: skillLinks(names) },
        },
      });
    }

    for (const [index, project] of data.projects.entries()) {
      const { skills: names, ...fields } = project;
      await tx.project.create({
        data: {
          ...fields,
          profileId,
          sortOrder: index,
          skills: { create: skillLinks(names) },
        },
      });
    }
  }
}
