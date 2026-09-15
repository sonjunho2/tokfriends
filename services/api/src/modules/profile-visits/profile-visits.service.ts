import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { ProfileVisitListQueryDto } from "./dto";

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class ProfileVisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);

    if (actorAccountId === targetAccountId) {
      throw new BadRequestException("Cannot visit your own activity account");
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
                throw new BadRequestException("Profile visit is unavailable");
              }
            }

            const profileVisit = await transaction.profileVisit.create({
              data: {
                visitorAccountId: actorAccountId,
                visitedAccountId: targetAccountId,
              },
              select: { visitedAt: true },
            });

            return {
              recorded: true,
              account: {
                id: targetAccount.id,
                handle: targetAccount.handle,
                displayName: targetAccount.displayName,
              },
              visitedAt: profileVisit.visitedAt,
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

  async listReceived(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    query: ProfileVisitListQueryDto,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);

    const rows = await this.prisma.profileVisit.findMany({
      where: {
        visitedAccountId: actorAccountId,
        visitorAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ visitedAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        visitedAt: true,
        visitorAccount: {
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
        id: row.visitorAccount.id,
        handle: row.visitorAccount.handle,
        displayName: row.visitorAccount.displayName,
        visitedAt: row.visitedAt,
      })),
      offset: query.offset,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }

  async listSent(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    query: ProfileVisitListQueryDto,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);

    const rows = await this.prisma.profileVisit.findMany({
      where: {
        visitorAccountId: actorAccountId,
        visitedAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ visitedAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        visitedAt: true,
        visitedAccount: {
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
        id: row.visitedAccount.id,
        handle: row.visitedAccount.handle,
        displayName: row.visitedAccount.displayName,
        visitedAt: row.visitedAt,
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
