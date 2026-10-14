// services/api/src/modules/community/community.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async report(
    reporterId: string,
    dto: {
      targetUserId?: string;
      targetAccountId?: string;
      postId?: string;
      reason: string;
      blockUser?: boolean;
    },
  ) {
    let resolvedReportedId =
      dto.targetUserId || dto.targetAccountId
        ? await this.resolveTargetUserId(dto.targetUserId, dto.targetAccountId)
        : undefined;

    let validPostId: string | undefined = undefined;
    let extraReasonNotes = '';

    // 1. postId 검증 및 실제 DB 존재 여부 확인
    if (dto.postId) {
      const existingPost = await this.prisma.post.findUnique({
        where: { id: dto.postId },
        select: { id: true, userId: true },
      });
      if (existingPost) {
        validPostId = existingPost.id;
        // 피신고자가 미지정되었으면 게시글 작성자를 자동으로 피신고자로 지정
        if (!resolvedReportedId && existingPost.userId) {
          resolvedReportedId = existingPost.userId;
        }
      } else {
        extraReasonNotes += `[신고게시글ID: ${dto.postId}] `;
      }
    }

    // 2. reportedId 유저 실제 DB 존재 여부 확인
    if (resolvedReportedId) {
      if (resolvedReportedId === reporterId) {
        throw new BadRequestException("You cannot report yourself.");
      }
      const existingUser = await this.prisma.user.findUnique({
        where: { id: resolvedReportedId },
        select: { id: true },
      });
      if (!existingUser) {
        extraReasonNotes += `[피신고자ID: ${resolvedReportedId}] `;
        resolvedReportedId = undefined;
      }
    }

    const finalReason = extraReasonNotes ? `${extraReasonNotes}${dto.reason}` : dto.reason;

    // 3. 신고 레코드 생성
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: resolvedReportedId,
        postId: validPostId,
        reason: finalReason,
      },
    });

    // 4. 차단 옵션(blockUser) 선택 시 자동 차단 처리
    let blocked = false;
    if (dto.blockUser && resolvedReportedId && resolvedReportedId !== reporterId) {
      try {
        await this.block(reporterId, { blockedUserId: resolvedReportedId });
        blocked = true;
      } catch (e) {
        // quiet fallback: 차단 실패가 신고 자체를 롤백시키지 않음
      }
    }

    return { ok: true, id: report.id, blocked };
  }

  async block(
    userId: string,
    dto: { blockedUserId?: string; targetAccountId?: string },
  ) {
    const resolvedBlockedUserId = await this.resolveTargetUserId(
      dto.blockedUserId,
      dto.targetAccountId,
    );

    if (userId === resolvedBlockedUserId) {
      throw new BadRequestException("You cannot block yourself.");
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: resolvedBlockedUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException("User not found.");
    }

    for (let retryCount = 0; ; retryCount += 1) {
      try {
        const block = await this.prisma.$transaction(
          async (transaction) => {
            const createdBlock = await transaction.block.upsert({
              where: {
                userId_blockedUserId: {
                  userId,
                  blockedUserId: resolvedBlockedUserId,
                },
              },
              update: {},
              create: {
                userId,
                blockedUserId: resolvedBlockedUserId,
              },
            });

            await transaction.friendship.deleteMany({
              where: {
                OR: [
                  { requesterId: userId, addresseeId: resolvedBlockedUserId },
                  { requesterId: resolvedBlockedUserId, addresseeId: userId },
                ],
              },
            });

            const owners = await transaction.owner.findMany({
              where: {
                legacyUserId: { in: [userId, resolvedBlockedUserId] },
              },
              select: {
                legacyUserId: true,
                activityAccounts: {
                  select: { id: true },
                },
              },
            });
            const userOwner = owners.find(
              (owner) => owner.legacyUserId === userId,
            );
            const blockedUserOwner = owners.find(
              (owner) => owner.legacyUserId === resolvedBlockedUserId,
            );

            if (userOwner && blockedUserOwner) {
              const userAccountIds = userOwner.activityAccounts.map(
                (account) => account.id,
              );
              const blockedUserAccountIds =
                blockedUserOwner.activityAccounts.map((account) => account.id);

              await transaction.follow.deleteMany({
                where: {
                  OR: [
                    {
                      followerAccountId: { in: userAccountIds },
                      followingAccountId: { in: blockedUserAccountIds },
                    },
                    {
                      followerAccountId: { in: blockedUserAccountIds },
                      followingAccountId: { in: userAccountIds },
                    },
                  ],
                },
              });

              await transaction.interest.deleteMany({
                where: {
                  OR: [
                    {
                      senderAccountId: { in: userAccountIds },
                      targetAccountId: { in: blockedUserAccountIds },
                    },
                    {
                      senderAccountId: { in: blockedUserAccountIds },
                      targetAccountId: { in: userAccountIds },
                    },
                  ],
                },
              });

              await transaction.profileVisit.deleteMany({
                where: {
                  OR: [
                    {
                      visitorAccountId: { in: userAccountIds },
                      visitedAccountId: { in: blockedUserAccountIds },
                    },
                    {
                      visitorAccountId: { in: blockedUserAccountIds },
                      visitedAccountId: { in: userAccountIds },
                    },
                  ],
                },
              });
            }

            return createdBlock;
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );

        return { ok: true, id: block.id };
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

  async listBlocks(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        blockedUserId: true,
        createdAt: true,
        blockedUser: {
          select: {
            id: true,
            displayName: true,
            region1: true,
            region2: true,
            profile: {
              select: {
                nickname: true,
                headline: true,
                avatarUri: true,
              },
            },
          },
        },
      },
    });

    return {
      items: blocks.map((block) => ({
        id: block.id,
        blockedUserId: block.blockedUserId,
        createdAt: block.createdAt,
        user: block.blockedUser,
      })),
      total: blocks.length,
    };
  }

  async unblock(userId: string, blockedUserId: string) {
    await this.prisma.block.deleteMany({
      where: {
        userId,
        blockedUserId,
      },
    });

    return { ok: true };
  }

  private async resolveTargetUserId(
    targetUserId?: string,
    targetAccountId?: string,
  ) {
    const normalizedUserId = targetUserId?.trim() || undefined;
    const normalizedAccountId = targetAccountId?.trim() || undefined;

    if (!normalizedUserId && !normalizedAccountId) {
      throw new BadRequestException("Target user is required.");
    }

    if (!normalizedAccountId) {
      return normalizedUserId as string;
    }

    const account = await this.prisma.activityAccount.findFirst({
      where: {
        id: normalizedAccountId,
        status: "active",
        owner: {
          status: "active",
          legacyUserId: { not: null },
          legacyUser: { status: "active" },
        },
      },
      select: {
        owner: { select: { legacyUserId: true } },
      },
    });
    const resolvedUserId = account?.owner.legacyUserId;

    if (!resolvedUserId) {
      throw new NotFoundException("User not found.");
    }
    if (normalizedUserId && normalizedUserId !== resolvedUserId) {
      throw new BadRequestException("Target identity does not match.");
    }

    return resolvedUserId;
  }
}
