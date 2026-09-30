import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { FollowListQueryDto } from "./dto";

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class FollowsService {
  constructor(private readonly prisma: PrismaService) {}

  async follow(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);

    if (actorAccountId === targetAccountId) {
      throw new BadRequestException("Cannot follow your own activity account");
    }

    for (let retryCount = 0; ; retryCount += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const actorAccount = await transaction.activityAccount.findFirst({
              where: {
                id: actorAccountId,
                status: "active",
                owner: { status: "active" },
              },
              select: { id: true },
            });

            if (!actorAccount) {
              throw new ForbiddenException("Active activity account required");
            }

            const targetAccount = await transaction.activityAccount.findFirst({
              where: {
                id: targetAccountId,
                status: "active",
                owner: { status: "active" },
              },
              select: {
                id: true,
                handle: true,
                displayName: true,
                owner: { select: { legacyUserId: true } },
              },
            });

            if (!targetAccount) {
              throw new NotFoundException("Activity account not found");
            }

            if (targetAccount.owner.legacyUserId) {
              const block = await transaction.block.findFirst({
                where: {
                  OR: [
                    {
                      userId: currentUserId,
                      blockedUserId: targetAccount.owner.legacyUserId,
                    },
                    {
                      userId: targetAccount.owner.legacyUserId,
                      blockedUserId: currentUserId,
                    },
                  ],
                },
                select: { id: true },
              });

              if (block) {
                throw new BadRequestException("Follow is unavailable");
              }
            }

            const follow = await transaction.follow.upsert({
              where: {
                followerAccountId_followingAccountId: {
                  followerAccountId: actorAccountId,
                  followingAccountId: targetAccountId,
                },
              },
              update: {},
              create: {
                followerAccountId: actorAccountId,
                followingAccountId: targetAccountId,
              },
              select: { createdAt: true },
            });

            return {
              following: true,
              account: {
                id: targetAccount.id,
                handle: targetAccount.handle,
                displayName: targetAccount.displayName,
              },
              followedAt: follow.createdAt,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const shouldRetry =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          retryCount < MAX_TRANSACTION_RETRIES;

        if (!shouldRetry) {
          throw error;
        }
      }
    }
  }

  async unfollow(
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);

    await this.prisma.follow.deleteMany({
      where: {
        followerAccountId: actorAccountId,
        followingAccountId: targetAccountId,
      },
    });

    return { following: false };
  }

  async getStatus(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    await this.requireVisibleTarget(currentUserId, targetAccountId);

    if (actorAccountId === targetAccountId) {
      return { following: false };
    }

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerAccountId_followingAccountId: {
          followerAccountId: actorAccountId,
          followingAccountId: targetAccountId,
        },
      },
      select: { id: true },
    });

    return { following: Boolean(follow) };
  }

  async listFollowers(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    accountId: string,
    query: FollowListQueryDto,
  ) {
    this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);
    await this.requireVisibleListTarget(accountId, blockedLegacyUserIds);

    const rows = await this.prisma.follow.findMany({
      where: {
        followingAccountId: accountId,
        followerAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        createdAt: true,
        followerAccount: {
          select: {
            id: true,
            handle: true,
            displayName: true,
          },
        },
      },
    });

    return {
      items: rows.slice(0, query.limit).map((row) => ({
        id: row.followerAccount.id,
        handle: row.followerAccount.handle,
        displayName: row.followerAccount.displayName,
        followedAt: row.createdAt,
      })),
      offset: query.offset,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }

  async listFollowing(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    accountId: string,
    query: FollowListQueryDto,
  ) {
    this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);
    await this.requireVisibleListTarget(accountId, blockedLegacyUserIds);

    const rows = await this.prisma.follow.findMany({
      where: {
        followerAccountId: accountId,
        followingAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        createdAt: true,
        followingAccount: {
          select: {
            id: true,
            handle: true,
            displayName: true,
          },
        },
      },
    });

    return {
      items: rows.slice(0, query.limit).map((row) => ({
        id: row.followingAccount.id,
        handle: row.followingAccount.handle,
        displayName: row.followingAccount.displayName,
        followedAt: row.createdAt,
      })),
      offset: query.offset,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }

  private requireActivityAccount(activityAccountId: string | null | undefined) {
    if (!activityAccountId) {
      throw new ForbiddenException("Active activity account required");
    }

    return activityAccountId;
  }

  private async requireVisibleTarget(
    currentUserId: string,
    targetAccountId: string,
  ) {
    const targetAccount = await this.prisma.activityAccount.findFirst({
      where: {
        id: targetAccountId,
        status: "active",
        owner: { status: "active" },
      },
      select: {
        id: true,
        owner: { select: { legacyUserId: true } },
      },
    });

    if (!targetAccount) {
      throw new NotFoundException("Activity account not found");
    }

    const targetLegacyUserId = targetAccount.owner.legacyUserId;
    if (!targetLegacyUserId) {
      return targetAccount;
    }

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { userId: currentUserId, blockedUserId: targetLegacyUserId },
          { userId: targetLegacyUserId, blockedUserId: currentUserId },
        ],
      },
      select: { id: true },
    });

    if (block) {
      throw new NotFoundException("Activity account not found");
    }

    return targetAccount;
  }

  private async getBlockedLegacyUserIds(currentUserId: string) {
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ userId: currentUserId }, { blockedUserId: currentUserId }],
      },
      select: {
        userId: true,
        blockedUserId: true,
      },
    });

    return blocks.map((block) =>
      block.userId === currentUserId ? block.blockedUserId : block.userId,
    );
  }

  private async requireVisibleListTarget(
    accountId: string,
    blockedLegacyUserIds: string[],
  ) {
    const account = await this.prisma.activityAccount.findFirst({
      where: {
        id: accountId,
        ...this.visibleAccountWhere(blockedLegacyUserIds),
      },
      select: { id: true },
    });

    if (!account) {
      throw new NotFoundException("Activity account not found");
    }
  }

  private visibleAccountWhere(
    blockedLegacyUserIds: string[],
  ): Prisma.ActivityAccountWhereInput {
    return {
      status: "active",
      owner: {
        status: "active",
        ...(blockedLegacyUserIds.length > 0
          ? {
              OR: [
                { legacyUserId: null },
                { legacyUserId: { notIn: blockedLegacyUserIds } },
              ],
            }
          : {}),
      },
    };
  }
}
