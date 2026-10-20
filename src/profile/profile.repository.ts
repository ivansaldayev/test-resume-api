import { Injectable } from '@nestjs/common';
import type { Profile, ProfileLink } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  findFirst(): Promise<Profile | null> {
    return this.prisma.profile.findFirst({ orderBy: { id: 'asc' } });
  }

  findLinksByProfileIds(profileIds: number[]): Promise<ProfileLink[]> {
    return this.prisma.profileLink.findMany({
      where: { profileId: { in: profileIds } },
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }
}
