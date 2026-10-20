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
});
