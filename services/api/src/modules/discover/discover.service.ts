import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { Prisma } from '@prisma/client';

type Filters = {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  region?: string; // region1/region2 검색용
};

function yearsAgo(base: Date, years: number) {
  return new Date(base.getFullYear() - years, base.getMonth(), base.getDate());
}

@Injectable()
export class DiscoverService {
  constructor(private prisma: PrismaService) {}

  async findUsers(filters: Filters, currentUserId?: string) {
    const now = new Date();
    const where: Prisma.UserWhereInput = { role: 'user', status: 'active' };

    if (currentUserId) {
      where.NOT = [
        { id: currentUserId },
        {
          blocksToMe: {
            some: { userId: currentUserId },
          },
        },
        {
          blocksByMe: {
            some: { blockedUserId: currentUserId },
          },
        },
      ];
    }

    if (filters.gender) where.gender = filters.gender;

    if (typeof filters.ageMin === 'number' || typeof filters.ageMax === 'number') {
      const dob: Prisma.DateTimeFilter = {};
      if (typeof filters.ageMin === 'number') dob.lte = yearsAgo(now, filters.ageMin);
      if (typeof filters.ageMax === 'number') dob.gte = yearsAgo(now, (filters.ageMax ?? 0) + 1);
      where.dob = dob;
    }

    if (filters.region) {
      where.OR = [
        { region1: { contains: filters.region } },
        { region2: { contains: filters.region } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        displayName: true,
        gender: true,
        dob: true,
        region1: true,
        region2: true,
        profile: {
          select: {
            nickname: true,
            bio: true,
            headline: true,
            avatarUri: true,
            interests: true,
            badges: true,
            lastSeenAt: true,
          },
        },
      },
    });
  }
}
