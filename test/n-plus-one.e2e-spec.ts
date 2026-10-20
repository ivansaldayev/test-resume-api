import { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { PrismaClient } from '../src/generated/prisma/client.js';
import { exampleQuery } from '../src/graphql/example-query.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, graphql, resetDatabase } from './helpers.js';

const fullQuery = `{
  profile {
    name
    links { url }
    skills { name }
    experience { company skills { name } }
    projects { name skills { name } }
  }
}`;

const sizes = [
  { items: 1, skills: 1 },
  { items: 5, skills: 3 },
];

describe('SQL count', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sqlCount = 0;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    (prisma as PrismaClient<'query'>).$on('query', () => {
      sqlCount += 1;
    });
  });

  beforeEach(() => resetDatabase(app));

  afterAll(() => app?.close());

  async function createProfile(items: number, skillsPerItem: number) {
    const { id: profileId } = await prisma.profile.create({
      data: {
        slug: 'jane-doe',
        name: 'Jane Doe',
        title: 'Backend developer',
        description: 'I build APIs.',
        links: {
          create: [
            { type: 'EMAIL', url: 'mailto:jane@example.com', sortOrder: 0 },
          ],
        },
      },
    });
    const skills = await prisma.skill.createManyAndReturn({
      data: Array.from({ length: skillsPerItem }, (_, index) => ({
        profileId,
        name: `Skill ${index}`,
        category: 'BACKEND' as const,
        sortOrder: index,
      })),
    });
    const skillLinks = skills.map((skill, index) => ({
      skillId: skill.id,
      sortOrder: index,
    }));

    for (let index = 0; index < items; index++) {
      await prisma.experience.create({
        data: {
          profileId,
          company: `Company ${index}`,
          position: 'Developer',
          startDate: new Date(Date.UTC(2020 + index, 0, 1)),
          skills: { create: skillLinks },
        },
      });
      await prisma.project.create({
        data: {
          profileId,
          name: `Project ${index}`,
          sortOrder: index,
          skills: { create: skillLinks },
        },
      });
    }
  }

  async function run(query: string) {
    sqlCount = 0;
    const response = await graphql(app, query).expect(200);
    expect(response.body.errors).toBeUndefined();
    return { sqlCount, profile: response.body.data.profile };
  }

  it.each(sizes)(
    'runs 4 SQL queries for the example query ($items per list)',
    async ({ items, skills }) => {
      await createProfile(items, skills);

      const result = await run(exampleQuery);

      expect(result.profile.skills).toHaveLength(skills);
      expect(result.profile.experience).toHaveLength(items);
      expect(result.profile.projects).toHaveLength(items);
      expect(result.sqlCount).toBe(4);
    },
  );

  it.each(sizes)(
    'runs 9 SQL queries for the full query ($items per list)',
    async ({ items, skills }) => {
      await createProfile(items, skills);

      const result = await run(fullQuery);

      expect(result.profile.experience).toHaveLength(items);
      expect(result.profile.projects).toHaveLength(items);
      for (const item of [
        ...result.profile.experience,
        ...result.profile.projects,
      ]) {
        expect(item.skills).toHaveLength(skills);
      }
      expect(result.sqlCount).toBe(9);
    },
  );
});
