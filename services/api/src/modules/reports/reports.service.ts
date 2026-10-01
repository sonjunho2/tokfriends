// services/api/src/modules/reports/reports.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ReportStatus } from '@prisma/client';

const REPORT_INCLUDE = {
  reporter: {
    select: {
      id: true,
      email: true,
      displayName: true,
      profile: { select: { nickname: true, avatarUri: true } },
    },
  },
  reported: {
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      trustScore: true,
      profile: { select: { nickname: true, avatarUri: true } },
    },
  },
  post: {
    select: {
      id: true,
      content: true,
      mediaUrls: true,
      topicId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          displayName: true,
          profile: { select: { nickname: true, avatarUri: true } },
        },
      },
    },
  },
};

function formatReport(r: any) {
  return {
    id: r.id,
    reason: r.reason,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reporter: r.reporter
      ? {
          id: r.reporter.id,
          email: r.reporter.email,
          displayName:
            r.reporter.profile?.nickname ||
            r.reporter.displayName ||
            '회원',
          nickname:
            r.reporter.profile?.nickname ||
            r.reporter.displayName ||
            '회원',
          avatarUri: r.reporter.profile?.avatarUri || null,
        }
      : null,
    reported: r.reported
      ? {
          id: r.reported.id,
          email: r.reported.email,
          displayName:
            r.reported.profile?.nickname ||
            r.reported.displayName ||
            '회원',
          nickname:
            r.reported.profile?.nickname ||
            r.reported.displayName ||
            '회원',
          avatarUri: r.reported.profile?.avatarUri || null,
          status: r.reported.status,
          trustScore: r.reported.trustScore,
        }
      : null,
    post: r.post
      ? {
          id: r.post.id,
          content: r.post.content,
          mediaUrls: r.post.mediaUrls || [],
          topicId: r.post.topicId,
          createdAt: r.post.createdAt,
          authorName:
            r.post.user?.profile?.nickname ||
            r.post.user?.displayName ||
            '작성자',
        }
      : null,
  };
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async listRecent(limit: number) {
    const rows = await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: REPORT_INCLUDE,
    });
    return rows.map(formatReport);
  }

  async paginate(
    status: string | undefined,
    opt: { skip: number; take: number },
  ) {
    const normalized =
      status?.toUpperCase() as keyof typeof ReportStatus | undefined;
    const statusEnum = normalized ? ReportStatus[normalized] : undefined;

    const where = statusEnum ? { status: statusEnum } : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: opt.skip,
        take: opt.take,
        include: REPORT_INCLUDE,
      }),
    ]);

    const items = rows.map(formatReport);
    return [total, items] as const;
  }

  async updateStatus(id: number, status: ReportStatus) {
    try {
      const updated = await this.prisma.report.update({
        where: { id },
        data: { status },
        include: REPORT_INCLUDE,
      });
      return formatReport(updated);
    } catch {
      return null;
    }
  }

  async blockReportedUser(reportId: number, reason?: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { reporterId: true, reportedId: true, status: true },
    });

    if (!report || !report.reportedId) return null;

    const { reporterId, reportedId } = report;

    // Upsert block: reporter blocks the reported user
    await this.prisma.block.upsert({
      where: {
        userId_blockedUserId: {
          userId: reporterId,
          blockedUserId: reportedId,
        },
      },
      update: {},
      create: { userId: reporterId, blockedUserId: reportedId },
    });

    // Mark report as RESOLVED
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    // Create audit log entry
    await this.prisma.auditLog.create({
      data: {
        actorId: null,
        target: `user:${reportedId}`,
        action: 'admin.block_reported_user',
        reason: reason ?? `Blocked via report #${reportId}`,
        context: { reportId, reporterId, reportedId },
      },
    });

    return { reportId, reportedId, blocked: true };
  }

  async sanctionReportedUser(
    reportId: number,
    action: 'WARNING' | 'SUSPEND_7D' | 'SUSPEND_30D' | 'PERMANENT_BAN',
    reason?: string,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, reportedId: true },
    });

    if (!report || !report.reportedId) {
      throw new NotFoundException('신고 정보 또는 피신고자를 찾을 수 없습니다.');
    }

    const reportedId = report.reportedId;
    const memo = reason?.trim() || `신고 #${reportId} 제재 처리 (${action})`;

    if (action === 'WARNING') {
      await this.prisma.user.update({
        where: { id: reportedId },
        data: {
          trustScore: {
            decrement: 5,
          },
        },
      });
    } else if (action === 'SUSPEND_7D' || action === 'SUSPEND_30D') {
      await this.prisma.user.update({
        where: { id: reportedId },
        data: {
          status: 'suspended',
          tokenVersion: { increment: 1 },
          trustScore: { decrement: 20 },
        },
      });
      await this.prisma.owner.updateMany({
        where: { legacyUserId: reportedId },
        data: { status: 'suspended' },
      });
    } else if (action === 'PERMANENT_BAN') {
      await this.prisma.user.update({
        where: { id: reportedId },
        data: {
          status: 'banned',
          tokenVersion: { increment: 1 },
          trustScore: 0,
        },
      });
      await this.prisma.owner.updateMany({
        where: { legacyUserId: reportedId },
        data: { status: 'banned' },
      });
    } else {
      throw new BadRequestException('올바르지 않은 제재 조치입니다.');
    }

    // Mark report as RESOLVED
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        actorId: null,
        target: `user:${reportedId}`,
        action: `admin.sanction_${action.toLowerCase()}`,
        reason: memo,
        context: { reportId, reportedId, action },
      },
    });

    return {
      reportId,
      reportedId,
      action,
      success: true,
    };
  }

  async deleteReportedPost(reportId: number) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, postId: true },
    });

    if (!report || !report.postId) {
      throw new NotFoundException('신고된 게시글이 존재하지 않습니다.');
    }

    const postId = report.postId;

    // Delete post (Cascades comments and likes)
    const existingPost = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (existingPost) {
      await this.prisma.post.delete({
        where: { id: postId },
      });
    }

    // Mark report as RESOLVED
    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        actorId: null,
        target: `post:${postId}`,
        action: 'admin.delete_reported_post',
        reason: `신고 #${reportId}에 따른 유해 게시물 즉시 삭제`,
        context: { reportId, postId },
      },
    });

    return {
      reportId,
      postId,
      deleted: true,
    };
  }
}
