// services/api/src/modules/community/community.service.ts
import { Injectable } from '@nestjs/common';
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
    const block = await this.prisma.block.create({
      data: {
        userId,
        blockedUserId: dto.blockedUserId,
      },
    });

    return { ok: true, id: block.id };
  }
}
