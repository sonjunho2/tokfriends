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
}
