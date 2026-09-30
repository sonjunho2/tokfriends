import { Injectable } from "@nestjs/common";
import { PrismaService } from "nestjs-prisma";
import { Prisma } from "@prisma/client";
import {
  buildDefaultActivityAccountOrderBy,
  isDefaultActivityAccountCandidate,
} from "../../common/activity-account-selection";

type Filters = {
  gender?: string;
  ageMin?: number;
  ageMax?: number;
  region?: string; // region1/region2 검색용
  q?: string; // 키워드 검색 (닉네임, 소개글, 관심사)
  interest?: string; // 특정 관심사 태그 필터
  limit?: number;
};

function yearsAgo(base: Date, years: number) {
  return new Date(base.getFullYear() - years, base.getMonth(), base.getDate());
}

function calculateAge(dob: Date, now: Date) {
  let age = now.getFullYear() - dob.getFullYear();

  const birthdayNotReached =
    now.getMonth() < dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate());

  if (birthdayNotReached) age -= 1;

  return Math.max(0, age);
}

@Injectable()
export class DiscoverService {
  constructor(private prisma: PrismaService) {}

  async findUsers(filters: Filters, currentUserId?: string) {
    const now = new Date();
    const where: Prisma.UserWhereInput = { role: "user", status: "active" };

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

    if (
      typeof filters.ageMin === "number" ||
      typeof filters.ageMax === "number"
    ) {
      const dob: Prisma.DateTimeFilter = {};
      if (typeof filters.ageMin === "number")
        dob.lte = yearsAgo(now, filters.ageMin);
      if (typeof filters.ageMax === "number")
        dob.gte = yearsAgo(now, (filters.ageMax ?? 0) + 1);
      where.dob = dob;
    }

    const andConditions: Prisma.UserWhereInput[] = [];

    if (filters.region?.trim()) {
      const region = filters.region.trim();
      andConditions.push({
        OR: [
          { region1: { contains: region, mode: Prisma.QueryMode.insensitive } },
          { region2: { contains: region, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (filters.q?.trim()) {
      const q = filters.q.trim();
      andConditions.push({
        OR: [
          { displayName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { profile: { nickname: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          { profile: { bio: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          { profile: { headline: { contains: q, mode: Prisma.QueryMode.insensitive } } },
          { profile: { interests: { has: q } } },
        ],
      });
    }

    if (filters.interest?.trim()) {
      andConditions.push({
        profile: {
          interests: { has: filters.interest.trim() },
        },
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const take = Math.min(100, Math.max(1, filters.limit ?? 50));

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
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
        ownerBridge: {
          select: {
            status: true,
            legacyUserId: true,
            activityAccounts: {
              where: { status: "active" },
              orderBy: buildDefaultActivityAccountOrderBy(),
              select: {
                id: true,
                status: true,
                isPrimary: true,
                legacyUserId: true,
              },
            },
          },
        },
      },
    });

    return users.map(({ dob, ownerBridge, ...user }) => {
      const targetAccountId =
        ownerBridge?.status === "active" && ownerBridge.legacyUserId === user.id
          ? (ownerBridge.activityAccounts.find((account) =>
              isDefaultActivityAccountCandidate(account, user.id),
            )?.id ?? null)
          : null;

      return {
        ...user,
        targetAccountId,
        age: dob ? calculateAge(dob, now) : null,
      };
    });
  }
}
