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
}
