// services/api/src/modules/community/community.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async report(
    reporterId: string,
    dto: { targetUserId?: string; postId?: string; reason: string },
  ) {
    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId: dto.targetUserId,
        postId: dto.postId,
        reason: dto.reason,
      },
    });

    return { ok: true, id: report.id };
  }

  async block(userId: string, dto: { blockedUserId: string }) {
    if (userId === dto.blockedUserId) {
      throw new BadRequestException('You cannot block yourself.');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.blockedUserId },
      select: { id: true },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found.');
    }

    const block = await this.prisma.block.upsert({
      where: {
        userId_blockedUserId: {
          userId,
          blockedUserId: dto.blockedUserId,
        },
      },
      update: {},
      create: {
        userId,
        blockedUserId: dto.blockedUserId,
      },
    });

    return { ok: true, id: block.id };
  }

  async listBlocks(userId: string) {
    const blocks = await this.prisma.block.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
}
