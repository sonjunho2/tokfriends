import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'nestjs-prisma';

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';

export interface ReportUserSummary {
  id: string;
  nickname: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  status?: string;
  trustScore?: number;
  warningCount?: number;
}

export interface ReportPostSummary {
  id: string;
  content: string;
  mediaUrls?: string[];
  topicId?: string;
  createdAt?: string;
  authorName?: string;
}

export interface AdminReportItem {
  id: number;
  category: 'PRIVATE_CALL' | 'LIVE_STREAM' | 'POST' | 'CHAT_MESSAGE' | 'PROFILE';
  reason: string;
  details?: string;
  status: ReportStatus;
  aiRiskScore?: number;
  aiFlag?: string;
  evidenceUrls?: string[];
  snapshotUrls?: string[];
  reporter: ReportUserSummary | null;
  reported: ReportUserSummary | null;
  post: ReportPostSummary | null;
  adminMemo?: string;
  sanctionHistory?: string[];
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SanctionLogItem {
  id: string;
  reportId: number;
  targetUserId: string;
  targetUserNickname: string;
  action: 'WARNING' | 'SUSPEND_7D' | 'SUSPEND_30D' | 'PERMANENT_BAN';
  reason: string;
  actorId?: string;
  createdAt: string;
}

const INITIAL_REPORTS: AdminReportItem[] = [
  {
    id: 1001,
    category: 'PRIVATE_CALL',
    reason: '1:1 영상 통화 중 불법 녹화 및 외부 메신저 유도 협박',
    details: '영상 통화 연결 후 3분 만에 카카오톡 아이디를 요구하며 사적인 영상을 캡처했다고 협박했습니다.',
    status: 'PENDING',
    aiRiskScore: 96,
    aiFlag: 'SEXUAL_EXTORTION_AND_EXTERNAL_MESSENGER',
    snapshotUrls: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    ],
    reporter: {
      id: 'usr-301',
      nickname: '은별_Live 🎙️',
      displayName: '이은별',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      role: 'CREATOR',
      status: 'active',
      trustScore: 99,
    },
    reported: {
      id: 'usr-901',
      nickname: '어둠의사냥꾼',
      displayName: '최모씨',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'USER',
      status: 'warning',
      trustScore: 35,
      warningCount: 2,
    },
    post: null,
    sanctionHistory: ['2026-09-20 1차 경고 (비매너 언행)'],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 1002,
    category: 'POST',
    reason: '커뮤니티 피드 불법 사설 도박 및 성매매 조건만남 광고 도배',
    details: '새벽 시간대에 텔레그램 링크를 포함하여 동일한 사설 토토 홍보글을 5회 연속 게시했습니다.',
    status: 'REVIEWING',
    aiRiskScore: 92,
    aiFlag: 'GAMBLING_SPAM_AND_SOLICITATION',
    reporter: {
      id: 'usr-201',
      nickname: '라이더민수',
      displayName: '김민수',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 95,
    },
    reported: {
      id: 'bad-user-99',
      nickname: '조건문의_카톡ID',
      displayName: '불량 유저',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      role: 'USER',
      status: 'warning',
      trustScore: 20,
      warningCount: 3,
    },
    post: {
      id: 'post-104',
      content: '심심한 분 카톡 open-chat 링크로 오세요. 앱 내 통화 말고 외부 카카오톡으로 바로 연락 주실 분 구합니다. 조건 맞춰드립니다.',
      mediaUrls: [],
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      authorName: '조건문의_카톡ID',
    },
    sanctionHistory: ['2026-10-10 7일 이용 정지'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
  {
    id: 1003,
    category: 'LIVE_STREAM',
    reason: '오픈 라이브 방송 중 지속적인 성희롱 및 폭언 채팅',
    details: '호스트가 노래를 부르는 도중 의상과 신체를 비하하고 지속적으로 음란한 단어를 반복했습니다.',
    status: 'PENDING',
    aiRiskScore: 84,
    aiFlag: 'HARASSMENT_AND_SEXUAL_SLURS',
    reporter: {
      id: 'usr-405',
      nickname: '초보호스트루나',
      displayName: '루나',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      role: 'CREATOR',
      status: 'active',
      trustScore: 98,
    },
    reported: {
      id: 'usr-882',
      nickname: '장난꾸러기99',
      displayName: '박장난',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 68,
      warningCount: 0,
    },
    post: null,
    createdAt: new Date(Date.now() - 3600000 * 7).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: 1004,
    category: 'CHAT_MESSAGE',
    reason: '타인 명의 도용 및 사기성 상품권 핀번호 요구',
    details: '다가온 공식 직원을 사칭하며 무료 온(ON) 충전 이벤트 당첨이라 속이고 문화상품권 핀번호를 요구했습니다.',
    status: 'RESOLVED',
    aiRiskScore: 98,
    aiFlag: 'IMPERSONATION_AND_PHISHING_FRAUD',
    reporter: {
      id: 'usr-105',
      nickname: '착한다가온유저',
      displayName: '홍길동',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 96,
    },
    reported: {
      id: 'usr-660',
      nickname: '운영자_사칭범',
      displayName: '이해커',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      role: 'USER',
      status: 'banned',
      trustScore: 0,
      warningCount: 5,
    },
    post: null,
    adminMemo: '신속 확인 결과 사칭 사기 명백하여 즉시 영구 이용정지(BANNED) 및 기기 차단 완료.',
    sanctionHistory: ['2026-10-16 영구 제재 (PERMANENT_BAN)'],
    resolvedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 1005,
    category: 'PROFILE',
    reason: '타인 유명 인플루언서 인스타 사진 무단 도용',
    details: '실제 본인이 아닌 인스타그램 유명 모델 사진 5장을 프로필로 등록하고 대화 시 거짓 신분을 주장했습니다.',
    status: 'REJECTED',
    aiRiskScore: 42,
    aiFlag: 'LOW_CONFIDENCE_IMPERSONATION',
    reporter: {
      id: 'usr-551',
      nickname: '의심많은탐정',
      displayName: '정탐정',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 88,
    },
    reported: {
      id: 'usr-442',
      nickname: '꽃길만걷자',
      displayName: '김꽃길',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      role: 'USER',
      status: 'active',
      trustScore: 85,
      warningCount: 0,
    },
    post: null,
    adminMemo: '실명 인증 및 라이브 셀카 대조 결과 본인 확인되어 기각 처리함.',
    resolvedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
];

@Injectable()
export class ReportsService implements OnModuleInit {
  private readonly logger = new Logger(ReportsService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private reports: AdminReportItem[] = [];
  private sanctions: SanctionLogItem[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      const reportsPath = path.join(this.dataDir, 'reports.json');
      if (fs.existsSync(reportsPath)) {
        const raw = fs.readFileSync(reportsPath, 'utf-8');
        this.reports = JSON.parse(raw);
      } else {
        this.reports = [...INITIAL_REPORTS];
        this.saveReports();
      }

      const sanctionsPath = path.join(this.dataDir, 'sanctions.json');
      if (fs.existsSync(sanctionsPath)) {
        const raw = fs.readFileSync(sanctionsPath, 'utf-8');
        this.sanctions = JSON.parse(raw);
      } else {
        this.sanctions = [];
        this.saveSanctions();
      }

      this.logger.log(`ReportsService initialized with ${this.reports.length} reports.`);
    } catch (err) {
      this.logger.error('Failed to load reports data', err);
      this.reports = [...INITIAL_REPORTS];
    }
  }

  private saveReports() {
    try {
      const reportsPath = path.join(this.dataDir, 'reports.json');
      fs.writeFileSync(reportsPath, JSON.stringify(this.reports, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save reports.json', err);
    }
  }

  private saveSanctions() {
    try {
      const sanctionsPath = path.join(this.dataDir, 'sanctions.json');
      fs.writeFileSync(sanctionsPath, JSON.stringify(this.sanctions, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to save sanctions.json', err);
    }
  }

  // ==========================================
  // Report Queries
  // ==========================================
  getReports(params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let list = [...this.reports];

    if (params?.status && params.status !== 'ALL') {
      list = list.filter((r) => r.status === params.status);
    }

    if (params?.category && params.category !== 'ALL') {
      list = list.filter((r) => r.category === params.category);
    }

    if (params?.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      list = list.filter(
        (r) =>
          r.reason.toLowerCase().includes(q) ||
          r.details?.toLowerCase().includes(q) ||
          r.reporter?.nickname.toLowerCase().includes(q) ||
          r.reported?.nickname.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const page = Number(params?.page) || 1;
    const limit = Number(params?.limit) || 20;
    const total = list.length;
    const startIndex = (page - 1) * limit;
    const items = list.slice(startIndex, startIndex + limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  getRecentReports(limit = 10) {
    return [...this.reports]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  getReportStats() {
    const total = this.reports.length;
    const pending = this.reports.filter((r) => r.status === 'PENDING').length;
    const reviewing = this.reports.filter((r) => r.status === 'REVIEWING').length;
    const resolved = this.reports.filter((r) => r.status === 'RESOLVED').length;
    const rejected = this.reports.filter((r) => r.status === 'REJECTED').length;
    const highRisk = this.reports.filter((r) => (r.aiRiskScore || 0) >= 80).length;

    return {
      total,
      pending,
      reviewing,
      resolved,
      rejected,
      highRisk,
      slaComplianceRate: '98.7%',
      avgResolutionMinutes: 18,
    };
  }

  getReportById(id: number) {
    return this.reports.find((r) => r.id === id);
  }

  updateReportStatus(id: number, status: ReportStatus, memo?: string) {
    const idx = this.reports.findIndex((r) => r.id === id);
    if (idx === -1) return null;

    const current = this.reports[idx];
    const updated: AdminReportItem = {
      ...current,
      status,
      adminMemo: memo ?? current.adminMemo,
      resolvedAt: status === 'RESOLVED' || status === 'REJECTED' ? new Date().toISOString() : current.resolvedAt,
      updatedAt: new Date().toISOString(),
    };
    this.reports[idx] = updated;
    this.saveReports();
    return updated;
  }

  blockReportedUser(id: number, reason?: string, actorId?: string) {
    const report = this.getReportById(id);
    if (!report || !report.reported) {
      return { reportId: id, reportedId: '', blocked: false };
    }

    const reportedUserId = report.reported.id;
    report.reported.status = 'banned';
    report.status = 'RESOLVED';
    report.adminMemo = `관리자 차단 조치: ${reason || '이용약관 위반 및 회원 신고 누적'}`;
    report.sanctionHistory = report.sanctionHistory || [];
    report.sanctionHistory.push(`${new Date().toLocaleDateString()} 영구 차단 조치`);
    report.updatedAt = new Date().toISOString();
    this.saveReports();

    // Log sanction
    this.sanctions.unshift({
      id: `snc-${Date.now()}`,
      reportId: id,
      targetUserId: reportedUserId,
      targetUserNickname: report.reported.nickname,
      action: 'PERMANENT_BAN',
      reason: reason || '신고로 인한 영구 차단',
      actorId,
      createdAt: new Date().toISOString(),
    });
    this.saveSanctions();

    return { reportId: id, reportedId: reportedUserId, blocked: true };
  }

  sanctionUser(
    id: number,
    dto: { action: 'WARNING' | 'SUSPEND_7D' | 'SUSPEND_30D' | 'PERMANENT_BAN'; reason?: string },
    actorId?: string,
  ) {
    const report = this.getReportById(id);
    if (!report || !report.reported) {
      return { reportId: id, reportedId: '', action: dto.action, success: false };
    }

    const reportedUser = report.reported;
    const actionLabel =
      dto.action === 'WARNING'
        ? '경고 조치'
        : dto.action === 'SUSPEND_7D'
        ? '7일 정지'
        : dto.action === 'SUSPEND_30D'
        ? '30일 정지'
        : '영구 차단';

    if (dto.action === 'PERMANENT_BAN') {
      reportedUser.status = 'banned';
    } else if (dto.action === 'SUSPEND_7D' || dto.action === 'SUSPEND_30D') {
      reportedUser.status = 'suspended';
    } else {
      reportedUser.status = 'warning';
      reportedUser.warningCount = (reportedUser.warningCount || 0) + 1;
    }

    report.status = 'RESOLVED';
    report.adminMemo = `제재 적용: [${actionLabel}] 사유: ${dto.reason || '운영정책 위반'}`;
    report.sanctionHistory = report.sanctionHistory || [];
    report.sanctionHistory.push(`${new Date().toLocaleDateString()} ${actionLabel}`);
    report.updatedAt = new Date().toISOString();
    this.saveReports();

    this.sanctions.unshift({
      id: `snc-${Date.now()}`,
      reportId: id,
      targetUserId: reportedUser.id,
      targetUserNickname: reportedUser.nickname,
      action: dto.action,
      reason: dto.reason || actionLabel,
      actorId,
      createdAt: new Date().toISOString(),
    });
    this.saveSanctions();

    return { reportId: id, reportedId: reportedUser.id, action: dto.action, success: true };
  }

  deleteReportedPost(id: number) {
    const report = this.getReportById(id);
    if (!report || !report.post) {
      return { reportId: id, postId: '', deleted: false };
    }

    const postId = report.post.id;
    report.post = null;
    report.adminMemo = (report.adminMemo ? report.adminMemo + ' | ' : '') + '유해 게시글 영구 파기 완료';
    report.status = 'RESOLVED';
    report.updatedAt = new Date().toISOString();
    this.saveReports();

    return { reportId: id, postId, deleted: true };
  }
}
