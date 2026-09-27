// services/api/src/modules/reports/reports.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async listRecent(limit: number) {
    const rows = await this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reporter: { select: { id: true, email: true, displayName: true } },
        reported: { select: { id: true, email: true, displayName: true } },
        post: { select: { id: true, topicId: true, createdAt: true } },
      },
    });
    return rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: r.reporter,
      reported: r.reported,
      post: r.post,
    }));
  }

  async paginate(status: string | undefined, opt: { skip: number; take: number }) {
    const normalized = status?.toUpperCase() as keyof typeof ReportStatus | undefined;
    const statusEnum = normalized ? ReportStatus[normalized] : undefined;

    const where = statusEnum ? { status: statusEnum } : undefined;

    const [total, rows] = await Promise.all([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: opt.skip,
        take: opt.take,
        include: {
          reporter: { select: { id: true, email: true, displayName: true } },
          reported: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);

    const items = rows.map((r) => ({
      id: r.id,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt,
      reporter: r.reporter,
      reported: r.reported,
    }));

    return [total, items] as const;
  }

  async updateStatus(id: number, status: ReportStatus) {
    try {
      const updated = await this.prisma.report.update({
        where: { id },
        data: { status },
        include: {
          reporter: { select: { id: true, email: true, displayName: true } },
          reported: { select: { id: true, email: true, displayName: true } },
        },
      });
      return {
        id: updated.id,
        reason: updated.reason,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        reporter: updated.reporter,
        reported: updated.reported,
      };
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
      where: { userId_blockedUserId: { userId: reporterId, blockedUserId: reportedId } },
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
}
