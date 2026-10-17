import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';

export interface AnalyticsMetricItem {
  id: string;
  name: string;
  value: string;
  delta: string;
  description: string;
  pinned: boolean;
  category?: 'growth' | 'monetization' | 'safety' | 'engagement';
}

export interface AnalyticsReportJobItem {
  id: string;
  name: string;
  cadence: 'Daily' | 'Weekly' | 'Monthly';
  destination: 'Slack' | 'Email' | 'BigQuery';
  format: 'CSV' | 'XLSX' | 'Looker';
  active: boolean;
  lastRunAt?: string;
  recipients?: string;
}

export interface AnalyticsExportLogItem {
  id: string;
  title: string;
  generatedAt: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  fileSize?: string;
  downloadUrl?: string;
  dimension?: string;
  format?: string;
}

export interface CohortRow {
  cohortDate: string; // e.g. "10월 1주차", "10월 2주차"
  usersCount: number;
  d1: number; // percentage
  d3: number;
  d7: number;
  d14: number;
  d30: number;
}

export interface FunnelStage {
  step: number;
  name: string;
  count: number;
  conversionRate: number; // % from step 1
  dropRate: number; // % dropped from previous step
}

export interface HourlyTraffic {
  hour: string; // "00", "01", ..., "23"
  activeUsers: number;
  callMinutes: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly overviewFile = path.join(this.dataDir, 'analytics-overview.json');
  private readonly exportsFile = path.join(this.dataDir, 'analytics-exports.json');

  constructor(private readonly prisma: PrismaService) {
    this.ensureDataFiles();
  }

  private ensureDataFiles() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (!fs.existsSync(this.overviewFile)) {
        const defaultOverview = {
          metrics: [
            {
              id: 'metric-dau',
              name: '일간 활성 사용자 (DAU)',
              value: '48,230명',
              delta: '+6.2% vs 전주',
              description: '최근 24시간 내 앱에 접속한 고유 회원 수',
              pinned: true,
              category: 'growth',
            },
            {
              id: 'metric-mau',
              name: '월간 활성 사용자 (MAU)',
              value: '182,450명',
              delta: '+12.4% vs 전월',
              description: '당월 기준 최소 1회 이상 로그인/활동 회원',
              pinned: true,
              category: 'growth',
            },
            {
              id: 'metric-pur',
              name: '유료 결제 전환율 (PUR)',
              value: '8.7%',
              delta: '+0.8%p vs 전월',
              description: '전체 활동 회원 대비 온(ON) 유료 결제 경험자 비율',
              pinned: true,
              category: 'monetization',
            },
            {
              id: 'metric-call-duration',
              name: '1:1 통화 총 체류 시간',
              value: '34,200분/일',
              delta: '+14.5% vs 전주',
              description: '일일 성사된 1:1 프라이빗 영상/음성 통화 합산',
              pinned: true,
              category: 'engagement',
            },
            {
              id: 'metric-match-rate',
              name: '매칭 성공률',
              value: '42.8%',
              delta: '+2.1%p vs 전주',
              description: '탐색 카드 좋아요 후 24시간 내 대화방 연결 비율',
              pinned: false,
              category: 'engagement',
            },
            {
              id: 'metric-arpu',
              name: '결제 유저당 평균 매출 (ARPPU)',
              value: '46,500원',
              delta: '+5.3% vs 전주',
              description: '유료 결제 고객 1인당 월평균 충전 금액',
              pinned: false,
              category: 'monetization',
            },
            {
              id: 'metric-safety-sla',
              name: '신고 처리 SLA',
              value: '18분',
              delta: '-5분 단축',
              description: 'AI 1차 탐지 및 운영자 최종 제재 평균 소요 시간',
              pinned: false,
              category: 'safety',
            },
            {
              id: 'metric-churn',
              name: '주간 이탈률',
              value: '7.8%',
              delta: '-0.6%p 개선',
              description: '7일 연속 미접속 유저 비율',
              pinned: false,
              category: 'growth',
            },
          ],
          reportJobs: [
            {
              id: 'job-daily-kpi',
              name: '일간 핵심 KPI 다이제스트 (Daily Executive)',
              cadence: 'Daily',
              destination: 'Slack',
              format: 'CSV',
              active: true,
              lastRunAt: new Date(Date.now() - 3600000 * 5).toISOString(),
              recipients: '#dagaon-kpi-daily',
            },
            {
              id: 'job-weekly-cohort',
              name: '주간 코호트 리텐션 & 이탈 유저 분석 리포트',
              cadence: 'Weekly',
              destination: 'Email',
              format: 'XLSX',
              active: true,
              lastRunAt: new Date(Date.now() - 86400000 * 2).toISOString(),
              recipients: 'growth@dagaon.app, executive@dagaon.app',
            },
            {
              id: 'job-monthly-revenue',
              name: '월간 매출 & 정산 원장 스냅샷 (Tax/Accounting)',
              cadence: 'Monthly',
              destination: 'BigQuery',
              format: 'Looker',
              active: true,
              lastRunAt: new Date(Date.now() - 86400000 * 15).toISOString(),
              recipients: 'dagaon-analytics-dataset.prod_revenue',
            },
          ],
        };
        fs.writeFileSync(this.overviewFile, JSON.stringify(defaultOverview, null, 2), 'utf-8');
      }

      if (!fs.existsSync(this.exportsFile)) {
        const defaultExports: AnalyticsExportLogItem[] = [
          {
            id: 'exp-9001',
            title: '2026년 10월 1~2주차 가입 유저 코호트 리텐션 원장',
            generatedAt: new Date(Date.now() - 3600000 * 2).toLocaleString('ko-KR'),
            status: 'SUCCESS',
            fileSize: '4.8 MB',
            downloadUrl: '/api/admin/analytics/downloads/exp-9001.csv',
            dimension: 'Cohort',
            format: 'CSV',
          },
          {
            id: 'exp-9002',
            title: '1:1 영상통화 과금 & 플랫폼 수수료 일일 정산 요약본',
            generatedAt: new Date(Date.now() - 3600000 * 12).toLocaleString('ko-KR'),
            status: 'SUCCESS',
            fileSize: '1.2 MB',
            downloadUrl: '/api/admin/analytics/downloads/exp-9002.xlsx',
            dimension: 'Revenue',
            format: 'XLSX',
          },
          {
            id: 'exp-9003',
            title: 'AI 안전 스크리닝 및 유해 신고 제재 이력 감사 보고서',
            generatedAt: new Date(Date.now() - 86400000 * 1).toLocaleString('ko-KR'),
            status: 'SUCCESS',
            fileSize: '840 KB',
            downloadUrl: '/api/admin/analytics/downloads/exp-9003.csv',
            dimension: 'Safety',
            format: 'CSV',
          },
        ];
        fs.writeFileSync(this.exportsFile, JSON.stringify(defaultExports, null, 2), 'utf-8');
      }
    } catch (err) {
      this.logger.error('Failed to ensure analytics data files', err);
    }
  }

  private readOverviewData() {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(this.overviewFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Failed to read overview data', err);
      return { metrics: [], reportJobs: [] };
    }
  }

  private writeOverviewData(data: unknown) {
    try {
      fs.writeFileSync(this.overviewFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to write overview data', err);
    }
  }

  private readExportsData(): AnalyticsExportLogItem[] {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(this.exportsFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Failed to read exports data', err);
      return [];
    }
  }

  private writeExportsData(data: AnalyticsExportLogItem[]) {
    try {
      fs.writeFileSync(this.exportsFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to write exports data', err);
    }
  }

  async getOverview() {
    const overview = this.readOverviewData();
    const exportLogs = this.readExportsData();

    // Dynamically calculate live counts if Prisma has actual records
    try {
      const userCount = await this.prisma.user.count();
      if (userCount > 0) {
        const dauMetric = overview.metrics.find((m: AnalyticsMetricItem) => m.id === 'metric-dau');
        if (dauMetric) {
          dauMetric.value = `${userCount.toLocaleString()}명`;
        }
      }
    } catch {
      // Prisma offline, fallback smoothly
    }

    return {
      metrics: overview.metrics,
      reportJobs: overview.reportJobs,
      exportLogs,
    };
  }

  async createMetric(dto: Partial<AnalyticsMetricItem>) {
    const overview = this.readOverviewData();
    const newMetric: AnalyticsMetricItem = {
      id: `metric-${Date.now()}`,
      name: dto.name || '신규 커스텀 지표',
      value: dto.value || '0',
      delta: dto.delta || '0%',
      description: dto.description || '',
      pinned: Boolean(dto.pinned),
      category: dto.category || 'growth',
    };
    overview.metrics.push(newMetric);
    this.writeOverviewData(overview);
    return newMetric;
  }

  async updateMetric(id: string, dto: Partial<AnalyticsMetricItem>) {
    const overview = this.readOverviewData();
    const idx = overview.metrics.findIndex((m: AnalyticsMetricItem) => m.id === id);
    if (idx === -1) {
      return null;
    }
    overview.metrics[idx] = { ...overview.metrics[idx], ...dto };
    this.writeOverviewData(overview);
    return overview.metrics[idx];
  }

  async getReportJobs() {
    const overview = this.readOverviewData();
    return overview.reportJobs;
  }

  async updateReportJob(id: string, dto: Partial<AnalyticsReportJobItem>) {
    const overview = this.readOverviewData();
    const idx = overview.reportJobs.findIndex((j: AnalyticsReportJobItem) => j.id === id);
    if (idx === -1) {
      return null;
    }
    overview.reportJobs[idx] = { ...overview.reportJobs[idx], ...dto };
    this.writeOverviewData(overview);
    return overview.reportJobs[idx];
  }

  async toggleReportJob(id: string, active: boolean) {
    return this.updateReportJob(id, { active });
  }

  async triggerReportJob(id: string) {
    const overview = this.readOverviewData();
    const job = overview.reportJobs.find((j: AnalyticsReportJobItem) => j.id === id);
    if (!job) return null;

    job.lastRunAt = new Date().toISOString();
    this.writeOverviewData(overview);

    // Also add an export log
    const exports = this.readExportsData();
    const newExport: AnalyticsExportLogItem = {
      id: `exp-${Date.now().toString().slice(-4)}`,
      title: `${job.name} (수동 즉시 실행)`,
      generatedAt: new Date().toLocaleString('ko-KR'),
      status: 'SUCCESS',
      fileSize: '1.5 MB',
      downloadUrl: `/api/admin/analytics/downloads/exp-manual.csv`,
      dimension: job.cadence,
      format: job.format,
    };
    exports.unshift(newExport);
    this.writeExportsData(exports);

    return { job, exportLog: newExport };
  }

  async createExport(dto: { title?: string; dimension?: string; format?: string; note?: string }) {
    const exports = this.readExportsData();
    const newExport: AnalyticsExportLogItem = {
      id: `exp-${Date.now().toString().slice(-4)}`,
      title: dto.title || `다가온 ${dto.dimension || '데이터'} 집계 원장`,
      generatedAt: new Date().toLocaleString('ko-KR'),
      status: 'SUCCESS',
      fileSize: `${(Math.random() * 3 + 0.8).toFixed(1)} MB`,
      downloadUrl: `/api/admin/analytics/downloads/export-${Date.now()}.csv`,
      dimension: dto.dimension || 'General',
      format: dto.format || 'CSV',
    };
    exports.unshift(newExport);
    this.writeExportsData(exports);
    return newExport;
  }

  getCohortData(): CohortRow[] {
    return [
      { cohortDate: '10월 2주차', usersCount: 3840, d1: 72.4, d3: 58.2, d7: 46.1, d14: 38.0, d30: 31.5 },
      { cohortDate: '10월 1주차', usersCount: 4210, d1: 69.8, d3: 54.6, d7: 43.5, d14: 35.8, d30: 29.4 },
      { cohortDate: '9월 4주차', usersCount: 3950, d1: 68.2, d3: 52.1, d7: 41.8, d14: 34.2, d30: 28.1 },
      { cohortDate: '9월 3주차', usersCount: 3620, d1: 66.5, d3: 50.8, d7: 40.2, d14: 32.9, d30: 27.0 },
      { cohortDate: '9월 2주차', usersCount: 3410, d1: 65.1, d3: 49.3, d7: 39.0, d14: 31.5, d30: 26.2 },
    ];
  }

  getFunnelData(): FunnelStage[] {
    return [
      { step: 1, name: '앱 신규 설치', count: 12500, conversionRate: 100, dropRate: 0 },
      { step: 2, name: '간편 본인인증 & 가입 완료', count: 9850, conversionRate: 78.8, dropRate: 21.2 },
      { step: 3, name: '프로필 탐색 & 이웃 발견', count: 8120, conversionRate: 64.9, dropRate: 17.6 },
      { step: 4, name: '1:1 대화방 개설 / 라이브 입장', count: 5440, conversionRate: 43.5, dropRate: 33.0 },
      { step: 5, name: '1:1 프라이빗 통화 성사', count: 2680, conversionRate: 21.4, dropRate: 50.7 },
      { step: 6, name: '온(ON) 결제 / 선물 후원', count: 1088, conversionRate: 8.7, dropRate: 59.4 },
    ];
  }

  getHourlyTraffic(): HourlyTraffic[] {
    return [
      { hour: '00시', activeUsers: 24500, callMinutes: 1820 },
      { hour: '01시', activeUsers: 19800, callMinutes: 1420 },
      { hour: '02시', activeUsers: 12400, callMinutes: 890 },
      { hour: '03시', activeUsers: 7200, callMinutes: 410 },
      { hour: '04시', activeUsers: 4800, callMinutes: 220 },
      { hour: '05시', activeUsers: 4100, callMinutes: 180 },
      { hour: '06시', activeUsers: 6200, callMinutes: 290 },
      { hour: '07시', activeUsers: 9800, callMinutes: 450 },
      { hour: '08시', activeUsers: 15400, callMinutes: 720 },
      { hour: '09시', activeUsers: 21000, callMinutes: 980 },
      { hour: '10시', activeUsers: 23500, callMinutes: 1120 },
      { hour: '11시', activeUsers: 25400, callMinutes: 1280 },
      { hour: '12시', activeUsers: 28900, callMinutes: 1560 },
      { hour: '13시', activeUsers: 27100, callMinutes: 1410 },
      { hour: '14시', activeUsers: 26500, callMinutes: 1390 },
      { hour: '15시', activeUsers: 27800, callMinutes: 1480 },
      { hour: '16시', activeUsers: 29400, callMinutes: 1620 },
      { hour: '17시', activeUsers: 32100, callMinutes: 1840 },
      { hour: '18시', activeUsers: 36800, callMinutes: 2210 },
      { hour: '19시', activeUsers: 41200, callMinutes: 2650 },
      { hour: '20시', activeUsers: 44500, callMinutes: 2980 },
      { hour: '21시', activeUsers: 48230, callMinutes: 3420 }, // Peak
      { hour: '22시', activeUsers: 47900, callMinutes: 3380 },
      { hour: '23시', activeUsers: 38200, callMinutes: 2690 },
    ];
  }
}
