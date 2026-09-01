import { Injectable } from '@nestjs/common';
import { ReportStatus } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

type DashboardCardComparison = {
  direction: 'up' | 'down' | 'flat';
  absolute: number;
  percentage: number | null;
};

type DashboardCard = {
  id: string;
  title: string;
  value: number;
  unit?: string;
  hint?: string;
  comparison?: DashboardCardComparison;
};

type DashboardSection = {
  id: string;
  title: string;
  cards: DashboardCard[];
};

type DashboardPayload = {
  generatedAt: string;
  windows: { last24h: string; last7d: string };
  sections: DashboardSection[];
};

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  private dashboardCache?: { expiresAt: number; data: DashboardPayload };

  async getSummary() {
    const [users, posts, chats, reports, announcements, bannedWords, activeSubscriptions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.post.count(),
        this.prisma.chat.count(),
        this.prisma.report.count(),
        this.prisma.announcement.count({ where: { isActive: true } }),
        this.prisma.bannedWord.count(),
        this.prisma.subscription.count({ where: { status: 'active' } }),
      ]);

    return {
      users,
      posts,
      chats,
      reports,
      activeAnnouncements: announcements,
      bannedWords,
      activeSubscriptions,
    };
  }

  async getDashboard(): Promise<DashboardPayload> {
    if (this.dashboardCache && this.dashboardCache.expiresAt > Date.now()) {
      return this.dashboardCache.data;
    }

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const countActiveSenders = (since: Date) =>
      this.prisma.message
        .findMany({
          where: { createdAt: { gte: since } },
          distinct: ['senderId'],
          select: { senderId: true },
        })
        .then((rows) => rows.length);

    const [
      newUsers24h,
      newUsers7d,
      activeUsers24h,
      activeUsers7d,
      posts24h,
      posts7d,
      chats24h,
      chats7d,
      reportsPending,
      reports24h,
      reports7d,
      blocks24h,
      announcementsActive,
      subscriptionsActive,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: since24h } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      countActiveSenders(since24h),
      countActiveSenders(since7d),
      this.prisma.post.count({ where: { createdAt: { gte: since24h } } }),
      this.prisma.post.count({ where: { createdAt: { gte: since7d } } }),
      this.prisma.chat.count({ where: { lastMessageAt: { gte: since24h } } }),
      this.prisma.chat.count({ where: { lastMessageAt: { gte: since7d } } }),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.report.count({ where: { createdAt: { gte: since24h } } }),
      this.prisma.report.count({ where: { createdAt: { gte: since7d } } }),
      this.prisma.block.count({ where: { createdAt: { gte: since24h } } }),
      this.prisma.announcement.count({ where: { isActive: true } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    const sections: DashboardSection[] = [
      {
        id: 'users',
        title: '사용자 운영',
        cards: [
          {
            id: 'users:new24h',
            title: '신규 가입 (24h)',
            value: newUsers24h,
            hint: `최근 7일 누적 ${newUsers7d}`,
            comparison: this.delta(newUsers24h, newUsers7d / 7),
          },
          {
            id: 'users:active24h',
            title: '활성 사용자 (24h)',
            value: activeUsers24h,
            hint: `7일 평균 ${Math.round(activeUsers7d / 7 || 0)}`,
            comparison: this.delta(activeUsers24h, activeUsers7d / 7),
          },
          {
            id: 'users:subscriptions',
            title: '활성 구독',
            value: subscriptionsActive,
            hint: 'status=active',
          },
        ],
      },
      {
        id: 'matching',
        title: '매칭 & 큐',
        cards: [
          {
            id: 'matching:queueEstimate',
            title: '대기 추정 (24h)',
            value: Math.max(activeUsers24h - chats24h, 0),
            hint: '활성 사용자 - 최근 메시지 방',
          },
          {
            id: 'matching:conversations',
            title: '활성 채팅방 (24h)',
            value: chats24h,
            comparison: this.delta(chats24h, chats7d / 7),
          },
        ],
      },
      {
        id: 'community',
        title: '커뮤니티 & 안전',
        cards: [
          {
            id: 'posts:new24h',
            title: '신규 게시물 (24h)',
            value: posts24h,
            comparison: this.delta(posts24h, posts7d / 7),
          },
          {
            id: 'reports:pending',
            title: '검토 대기 신고',
            value: reportsPending,
            hint: 'status=PENDING',
          },
          {
            id: 'reports:new24h',
            title: '신규 신고 (24h)',
            value: reports24h,
            comparison: this.delta(reports24h, reports7d / 7),
          },
          {
            id: 'blocks:new24h',
            title: '차단 처리 (24h)',
            value: blocks24h,
          },
        ],
      },
      {
        id: 'operations',
        title: '운영 현황',
        cards: [
          {
            id: 'announcements:active',
            title: '활성 공지사항',
            value: announcementsActive,
          },
          {
            id: 'reports:slaBacklog',
            title: '신고 백로그 추정',
            value: Math.max(reportsPending - reports24h, 0),
            hint: '대기 - 24h 처리',
          },
        ],
      },
    ];

    const payload: DashboardPayload = {
      generatedAt: now.toISOString(),
      windows: { last24h: since24h.toISOString(), last7d: since7d.toISOString() },
      sections,
    };

    this.dashboardCache = { expiresAt: Date.now() + 60_000, data: payload };

    return payload;
  }

  private delta(current: number, baseline?: number): DashboardCardComparison {
    if (baseline === undefined || Number.isNaN(baseline)) {
      return { direction: 'flat', absolute: 0, percentage: null };
    }
    const diff = current - baseline;
    const direction: 'up' | 'down' | 'flat' = diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat';
    const percentage = baseline === 0 ? null : Math.round((diff / baseline) * 100);
    return { direction, absolute: Math.round(diff), percentage };
  }
}
