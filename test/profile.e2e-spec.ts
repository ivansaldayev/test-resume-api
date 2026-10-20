import { INestApplication } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { createApp, graphql, resetDatabase } from './helpers.js';

const janeDoe = {
  slug: 'jane-doe',
  name: 'Jane Doe',
  title: 'Backend developer',
  description: 'I build APIs.',
};

describe('profile', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  beforeEach(() => resetDatabase(app));

  afterAll(() => app?.close());

  it('returns the profile', async () => {
    await prisma.profile.create({ data: { ...janeDoe, location: 'Berlin' } });

    const response = await graphql(
      app,
      '{ profile { id name title description location } }',
    ).expect(200);

    expect(response.body).toEqual({
      data: {
        profile: {
          id: '1',
          name: 'Jane Doe',
          title: 'Backend developer',
          description: 'I build APIs.',
          location: 'Berlin',
        },
      },
    });
  });

  it('returns null for an empty location', async () => {
    await prisma.profile.create({ data: janeDoe });

    const response = await graphql(app, '{ profile { location } }').expect(200);

    expect(response.body).toEqual({ data: { profile: { location: null } } });
  });

  it('returns the first created profile', async () => {
    await prisma.profile.createMany({
      data: [
        { ...janeDoe, slug: 'first', name: 'First' },
        { ...janeDoe, slug: 'second', name: 'Second' },
      ],
    });
    await prisma.profile.update({
      where: { slug: 'first' },
      data: { title: 'New title' },
    });

    const response = await graphql(app, '{ profile { name } }').expect(200);

    expect(response.body).toEqual({ data: { profile: { name: 'First' } } });
  });

  it('returns NOT_FOUND when there is no profile', async () => {
    const response = await graphql(app, '{ profile { name } }').expect(200);

    expect(response.body.data).toBeNull();
    expect(response.body.errors).toMatchObject([
      {
        message: 'Profile not found',
        path: ['profile'],
        extensions: { code: 'NOT_FOUND' },
      },
    ]);
  });

  describe('links', () => {
    it('returns links in sort order', async () => {
      await prisma.profile.create({
        data: {
          ...janeDoe,
          links: {
            create: [
              {
                type: 'GITHUB',
                url: 'https://github.com/jane-doe',
                sortOrder: 1,
              },
              { type: 'EMAIL', url: 'mailto:jane@example.com', sortOrder: 0 },
            ],
          },
        },
      });

      const response = await graphql(
        app,
        '{ profile { links { type url } } }',
      ).expect(200);

      expect(response.body).toEqual({
        data: {
          profile: {
            links: [
              { type: 'EMAIL', url: 'mailto:jane@example.com' },
              { type: 'GITHUB', url: 'https://github.com/jane-doe' },
            ],
          },
        },
      });
    });

    it('returns an empty list when there are no links', async () => {
      await prisma.profile.create({ data: janeDoe });

      const response = await graphql(
        app,
        '{ profile { links { url } } }',
      ).expect(200);

      expect(response.body).toEqual({ data: { profile: { links: [] } } });
    });

    it('does not cache links between requests', async () => {
      const { id } = await prisma.profile.create({ data: janeDoe });
      const query = '{ profile { links { url } } }';

      await graphql(app, query).expect(200);
      await prisma.profileLink.create({
        data: {
          profileId: id,
          type: 'EMAIL',
          url: 'mailto:jane@example.com',
          sortOrder: 0,
        },
      });
      const response = await graphql(app, query).expect(200);

      expect(response.body).toEqual({
        data: { profile: { links: [{ url: 'mailto:jane@example.com' }] } },
      });
    });
  });

  describe('skills', () => {
    it('returns skills by category and sort order', async () => {
      const { id: profileId } = await prisma.profile.create({ data: janeDoe });
      await prisma.skill.createMany({
        data: [
          { profileId, name: 'React', category: 'FRONTEND', sortOrder: 0 },
          { profileId, name: 'NestJS', category: 'BACKEND', sortOrder: 2 },
          { profileId, name: 'TypeScript', category: 'LANGUAGE', sortOrder: 3 },
          { profileId, name: 'Node.js', category: 'BACKEND', sortOrder: 1 },
        ],
      });

      const response = await graphql(
        app,
        '{ profile { skills { id name category } } }',
      ).expect(200);

      expect(response.body).toEqual({
        data: {
          profile: {
            skills: [
              { id: '3', name: 'TypeScript', category: 'LANGUAGE' },
              { id: '4', name: 'Node.js', category: 'BACKEND' },
              { id: '2', name: 'NestJS', category: 'BACKEND' },
              { id: '1', name: 'React', category: 'FRONTEND' },
            ],
          },
        },
      });
    });

    it('returns an empty list when there are no skills', async () => {
      await prisma.profile.create({ data: janeDoe });

      const response = await graphql(
        app,
        '{ profile { skills { name } } }',
      ).expect(200);

      expect(response.body).toEqual({ data: { profile: { skills: [] } } });
    });
  });

  describe('experience', () => {
    it('returns experience from newest to oldest', async () => {
      const { id: profileId } = await prisma.profile.create({ data: janeDoe });
      await prisma.experience.createMany({
        data: [
          {
            profileId,
            company: 'Old Company',
            position: 'Junior developer',
            startDate: new Date('2019-05-01T00:00:00.000Z'),
            endDate: new Date('2020-02-01T00:00:00.000Z'),
          },
          {
            profileId,
            company: 'Current Company',
            position: 'Lead developer',
            location: 'Remote',
            startDate: new Date('2025-10-01T00:00:00.000Z'),
            achievements: ['Built the API', 'Set up CI'],
          },
          {
            profileId,
            company: 'Middle Company',
            position: 'Developer',
            startDate: new Date('2022-01-01T00:00:00.000Z'),
            endDate: new Date('2025-09-01T00:00:00.000Z'),
          },
        ],
      });

      const response = await graphql(
        app,
        '{ profile { experience { id company position location startDate endDate achievements } } }',
      ).expect(200);

      expect(response.body).toEqual({
        data: {
          profile: {
            experience: [
              {
                id: '2',
                company: 'Current Company',
                position: 'Lead developer',
                location: 'Remote',
                startDate: '2025-10',
                endDate: null,
                achievements: ['Built the API', 'Set up CI'],
              },
              {
                id: '3',
                company: 'Middle Company',
                position: 'Developer',
                location: null,
                startDate: '2022-01',
                endDate: '2025-09',
                achievements: [],
              },
              {
                id: '1',
                company: 'Old Company',
                position: 'Junior developer',
                location: null,
                startDate: '2019-05',
                endDate: '2020-02',
                achievements: [],
              },
            ],
          },
        },
      });
    });

    it('returns skills of each experience in sort order', async () => {
      const { id: profileId } = await prisma.profile.create({ data: janeDoe });
      await prisma.skill.createMany({
        data: [
          { profileId, name: 'TypeScript', category: 'LANGUAGE', sortOrder: 0 },
          { profileId, name: 'Node.js', category: 'BACKEND', sortOrder: 1 },
          { profileId, name: 'React', category: 'FRONTEND', sortOrder: 2 },
        ],
      });
      await prisma.experience.createMany({
        data: [
          {
            profileId,
            company: 'New Company',
            position: 'Developer',
            startDate: new Date('2024-01-01T00:00:00.000Z'),
          },
          {
            profileId,
            company: 'Old Company',
            position: 'Developer',
            startDate: new Date('2020-01-01T00:00:00.000Z'),
          },
        ],
      });
      await prisma.experienceSkill.createMany({
        data: [
          { experienceId: 1, skillId: 3, sortOrder: 1 },
          { experienceId: 2, skillId: 2, sortOrder: 0 },
          { experienceId: 1, skillId: 1, sortOrder: 0 },
        ],
      });

      const response = await graphql(
        app,
        '{ profile { experience { company skills { name } } } }',
      ).expect(200);

      expect(response.body).toEqual({
        data: {
          profile: {
            experience: [
              {
                company: 'New Company',
                skills: [{ name: 'TypeScript' }, { name: 'React' }],
              },
              { company: 'Old Company', skills: [{ name: 'Node.js' }] },
            ],
          },
        },
      });
    });

    it('returns empty lists when there is no data', async () => {
      const { id: profileId } = await prisma.profile.create({ data: janeDoe });

      const noExperience = await graphql(
        app,
        '{ profile { experience { company } } }',
      ).expect(200);
      expect(noExperience.body).toEqual({
        data: { profile: { experience: [] } },
      });

      await prisma.experience.create({
        data: {
          profileId,
          company: 'Company',
          position: 'Developer',
          startDate: new Date('2024-01-01T00:00:00.000Z'),
        },
      });
      const noSkills = await graphql(
        app,
        '{ profile { experience { skills { name } } } }',
      ).expect(200);
      expect(noSkills.body).toEqual({
        data: { profile: { experience: [{ skills: [] }] } },
      });
    });
  });
});
