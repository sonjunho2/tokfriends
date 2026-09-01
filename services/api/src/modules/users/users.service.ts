// services/api/src/modules/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { createHash } from 'crypto';

export type UserSearchFilters = {
  keyword?: string;
  phone?: string;
  status?: string;
  limit?: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async byId(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            reportsToMe: true,
            messages: true,
          },
        },
      },
    });
  }

  async search(term: string, take: number = 20) {
    const trimmed = term.trim();
    if (!trimmed) return [];

    const users = await this.searchUsers({ keyword: trimmed, limit: take });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            nickname: user.profile.nickname,
            bio: user.profile.bio,
            interests: user.profile.interests,
          }
        : null,
    }));
  }

  async searchUsers(filters: UserSearchFilters) {
    const where: Prisma.UserWhereInput = {};
    const or: Prisma.UserWhereInput['OR'] = [];

    const keyword = filters.keyword?.trim();
    if (keyword) {
      or.push(
        { email: { contains: keyword, mode: Prisma.QueryMode.insensitive } },
        { displayName: { contains: keyword, mode: Prisma.QueryMode.insensitive } },
        { profile: { nickname: { contains: keyword, mode: Prisma.QueryMode.insensitive } } },
      );
    }

    const phoneDigits = this.normalizePhone(filters.phone);
    if (phoneDigits) {
      where.phoneHash = this.hashPhone(phoneDigits);
    }

    if (filters.status?.trim()) {
      where.status = filters.status.trim().toLowerCase();
    }

    if (or.length) {
      where.OR = or;
    }

    const take = Math.min(100, Math.max(1, filters.limit ?? 50));

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        provider: true,
        createdAt: true,
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
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      nickname: user.profile?.nickname ?? null,
      status: user.status,
      provider: user.provider,
      createdAt: user.createdAt,
      region1: user.region1 ?? null,
      region2: user.region2 ?? null,
      profile: user.profile
        ? {
            nickname: user.profile.nickname,
            bio: user.profile.bio ?? null,
            headline: user.profile.headline ?? null,
            avatarUri: user.profile.avatarUri ?? null,
            interests: user.profile.interests ?? [],
            badges: user.profile.badges ?? [],
          }
        : null,
    }));
  }

  async updateProfile(
    id: string,
    payload: {
      displayName?: string | null;
      region1?: string | null;
      region2?: string | null;
      bio?: string | null;
      nickname?: string | null;
      interests?: string[];
      marketingOptIn?: boolean;
      headline?: string | null;
      avatarUri?: string | null;
    },
  ) {
    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: id },
      select: { nickname: true, badges: true, interests: true, visibility: true },
    });

    const profileVisibility = (
      existingProfile?.visibility && typeof existingProfile.visibility === 'object'
        ? { ...existingProfile.visibility }
        : {}
    ) as Record<string, any>;

    if (payload.marketingOptIn !== undefined) {
      profileVisibility.marketingOptIn = payload.marketingOptIn;
    }

    const profileUpdate: Prisma.ProfileUpdateInput = {};

    if (payload.bio !== undefined) {
      profileUpdate.bio = payload.bio ?? null;
    }

    if (payload.interests !== undefined) {
      profileUpdate.interests = payload.interests;
    }

    if (payload.headline !== undefined) {
      profileUpdate.headline = payload.headline ?? null;
    }

    if (payload.avatarUri !== undefined) {
      profileUpdate.avatarUri = payload.avatarUri ?? null;
    }

    if (payload.nickname !== undefined || payload.displayName !== undefined) {
      profileUpdate.nickname =
        payload.nickname ??
        payload.displayName ??
        existingProfile?.nickname ??
        '회원';
    }

    if (payload.marketingOptIn !== undefined) {
      profileUpdate.visibility = profileVisibility as any;
    }

    const updateData: Prisma.UserUpdateInput = {
      displayName: payload.displayName ?? undefined,
      region1: payload.region1 ?? undefined,
      region2: payload.region2 ?? undefined,
    };

    if (Object.keys(profileUpdate).length > 0) {
      updateData.profile = {
        upsert: {
          update: profileUpdate,
          create: {
            nickname:
              payload.nickname ?? payload.displayName ?? existingProfile?.nickname ?? '회원',
            bio: payload.bio ?? null,
            headline: payload.headline ?? null,
            avatarUri: payload.avatarUri ?? null,
            interests: payload.interests ?? existingProfile?.interests ?? [],
            badges: existingProfile?.badges ?? [],
            visibility: Object.keys(profileVisibility).length ? (profileVisibility as any) : undefined,
          },
        },
      };
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        profile: true,
        _count: {
          select: {
            posts: true,
            reportsToMe: true,
            messages: true,
          },
        },
      },
    });
  }

  private normalizePhone(phone?: string) {
    return phone ? phone.replace(/[^\d]/g, '') : '';
  }

  private hashPhone(phoneDigits: string) {
    return createHash('sha256').update(`KR:${phoneDigits}`).digest('hex');
  }
}
