import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { InterestListQueryDto } from "./dto";

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class InterestsService {
  constructor(private readonly prisma: PrismaService) {}

  async send(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);

    if (actorAccountId === targetAccountId) {
      throw new BadRequestException(
        "Cannot send interest to your own activity account",
      );
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
                throw new BadRequestException("Interest is unavailable");
              }
            }

            const interest = await transaction.interest.upsert({
              where: {
                senderAccountId_targetAccountId: {
                  senderAccountId: actorAccountId,
                  targetAccountId,
                },
              },
              update: {},
              create: {
                senderAccountId: actorAccountId,
                targetAccountId,
              },
              select: { createdAt: true },
            });

            return {
              interested: true,
              account: {
                id: targetAccount.id,
                handle: targetAccount.handle,
                displayName: targetAccount.displayName,
              },
              interestedAt: interest.createdAt,
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

  async remove(
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);

    await this.prisma.interest.deleteMany({
      where: {
        senderAccountId: actorAccountId,
        targetAccountId,
      },
    });

    return { interested: false };
  }

  async getStatus(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    targetAccountId: string,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    await this.requireVisibleTarget(currentUserId, targetAccountId);

    if (actorAccountId === targetAccountId) {
      return { interested: false };
    }

    const interest = await this.prisma.interest.findUnique({
      where: {
        senderAccountId_targetAccountId: {
          senderAccountId: actorAccountId,
          targetAccountId,
        },
      },
      select: { id: true },
    });

    return { interested: Boolean(interest) };
  }

  async listSent(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    query: InterestListQueryDto,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);

    const rows = await this.prisma.interest.findMany({
      where: {
        senderAccountId: actorAccountId,
        targetAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        createdAt: true,
        targetAccount: {
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
        id: row.targetAccount.id,
        handle: row.targetAccount.handle,
        displayName: row.targetAccount.displayName,
        interestedAt: row.createdAt,
      })),
      offset: query.offset,
      limit: query.limit,
      hasMore: rows.length > query.limit,
    };
  }

  async listReceived(
    currentUserId: string,
    actorActivityAccountId: string | null | undefined,
    query: InterestListQueryDto,
  ) {
    const actorAccountId = this.requireActivityAccount(actorActivityAccountId);
    const blockedLegacyUserIds =
      await this.getBlockedLegacyUserIds(currentUserId);

    const rows = await this.prisma.interest.findMany({
      where: {
        targetAccountId: actorAccountId,
        senderAccount: this.visibleAccountWhere(blockedLegacyUserIds),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: query.offset,
      take: query.limit + 1,
      select: {
        createdAt: true,
        senderAccount: {
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
        id: row.senderAccount.id,
        handle: row.senderAccount.handle,
        displayName: row.senderAccount.displayName,
        interestedAt: row.createdAt,
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
      return;
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
