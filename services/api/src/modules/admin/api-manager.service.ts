import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface ApiEndpointItem {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  module: 'Users' | 'Calls' | 'Chats' | 'Community' | 'Live' | 'Store' | 'Notifications' | 'Safety' | 'Auth' | 'Discover';
  description: string;
  rateLimitPerMin: number;
  enabled: boolean;
  requiresAuth: boolean;
  latencyMs: number;
  totalCalls24h: number;
  errorCount24h: number;
}

export interface ApiTrafficLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  statusCode: number;
  latencyMs: number;
  clientIp: string;
  userAgent: string;
}

export interface ExternalServiceHealth {
  name: string;
  status: 'OPERATIONAL' | 'DEGRADED' | 'DOWN';
  latencyMs: number;
  uptime: string;
  lastChecked: string;
}

@Injectable()
export class ApiManagerService {
  private readonly logger = new Logger(ApiManagerService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly endpointsFile = path.join(this.dataDir, 'api-endpoints.json');
  private readonly logsFile = path.join(this.dataDir, 'api-traffic-logs.json');

  constructor() {
    this.ensureDataFiles();
  }

  private ensureDataFiles() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (!fs.existsSync(this.endpointsFile)) {
        const defaultEndpoints: ApiEndpointItem[] = [
          // Auth & Users
          {
            id: 'ep-auth-login',
            method: 'POST',
            path: '/v1/auth/login/email',
            module: 'Auth',
            description: '이메일 기반 로그인 및 JWT 세션 토큰 발급',
            rateLimitPerMin: 15,
            enabled: true,
            requiresAuth: false,
            latencyMs: 38,
            totalCalls24h: 34200,
            errorCount24h: 12,
          },
          {
            id: 'ep-users-me',
            method: 'GET',
            path: '/v1/users/me',
            module: 'Users',
            description: '내 프로필 및 보유 온(ON) 잔여 포인트 조회',
            rateLimitPerMin: 120,
            enabled: true,
            requiresAuth: true,
            latencyMs: 18,
            totalCalls24h: 215400,
            errorCount24h: 4,
          },
          {
            id: 'ep-users-update-profile',
            method: 'PATCH',
            path: '/v1/users/profile',
            module: 'Users',
            description: '프로필 사진, 닉네임, 지역, 소개글 수정',
            rateLimitPerMin: 20,
            enabled: true,
            requiresAuth: true,
            latencyMs: 45,
            totalCalls24h: 12400,
            errorCount24h: 1,
          },

          // Discover
          {
            id: 'ep-discover-feed',
            method: 'GET',
            path: '/v1/discover',
            module: 'Discover',
            description: '주변 이웃 및 접속 중인 추천 인연 피드 탐색',
            rateLimitPerMin: 60,
            enabled: true,
            requiresAuth: true,
            latencyMs: 32,
            totalCalls24h: 489000,
            errorCount24h: 8,
          },

          // Calls (Private 1:1)
          {
            id: 'ep-calls-initiate',
            method: 'POST',
            path: '/v1/calls/private/initiate',
            module: 'Calls',
            description: '1:1 프라이빗 영상/음성 통화 세션 개설 및 첫 1분 선차감',
            rateLimitPerMin: 10,
            enabled: true,
            requiresAuth: true,
            latencyMs: 65,
            totalCalls24h: 26800,
            errorCount24h: 3,
          },
          {
            id: 'ep-calls-token',
            method: 'POST',
            path: '/v1/calls/private/token',
            module: 'Calls',
            description: 'Agora RTC 암호화 채널 참여 토큰 발급',
            rateLimitPerMin: 30,
            enabled: true,
            requiresAuth: true,
            latencyMs: 22,
            totalCalls24h: 53600,
            errorCount24h: 0,
          },
          {
            id: 'ep-calls-terminate',
            method: 'POST',
            path: '/v1/calls/private/terminate',
            module: 'Calls',
            description: '1:1 통화 종료 및 잔여 분당 정산 원장 마감',
            rateLimitPerMin: 20,
            enabled: true,
            requiresAuth: true,
            latencyMs: 40,
            totalCalls24h: 26750,
            errorCount24h: 1,
          },

          // Live Streaming
          {
            id: 'ep-live-rooms',
            method: 'GET',
            path: '/v1/live/rooms',
            module: 'Live',
            description: '실시간 진행 중인 라이브 방송 목록 조회',
            rateLimitPerMin: 60,
            enabled: true,
            requiresAuth: true,
            latencyMs: 28,
            totalCalls24h: 142000,
            errorCount24h: 2,
          },
          {
            id: 'ep-live-create',
            method: 'POST',
            path: '/v1/live/rooms',
            module: 'Live',
            description: '호스트 신규 라이브 스트리밍 룸 개설',
            rateLimitPerMin: 5,
            enabled: true,
            requiresAuth: true,
            latencyMs: 78,
            totalCalls24h: 3400,
            errorCount24h: 0,
          },

          // Chats
          {
            id: 'ep-chats-list',
            method: 'GET',
            path: '/v1/chats',
            module: 'Chats',
            description: '내 1:1 대화방 목록 및 안 읽은 메시지 수 조회',
            rateLimitPerMin: 100,
            enabled: true,
            requiresAuth: true,
            latencyMs: 24,
            totalCalls24h: 312000,
            errorCount24h: 5,
          },
          {
            id: 'ep-chats-message-send',
            method: 'POST',
            path: '/v1/chats/:id/messages',
            module: 'Chats',
            description: '1:1 대화방 텍스트/사진 전송 및 웹소켓 브로드캐스트',
            rateLimitPerMin: 150,
            enabled: true,
            requiresAuth: true,
            latencyMs: 35,
            totalCalls24h: 421000,
            errorCount24h: 9,
          },

          // Community Feed
          {
            id: 'ep-community-posts',
            method: 'GET',
            path: '/v1/posts',
            module: 'Community',
            description: '동네생활 및 일상 커뮤니티 피드 목록 조회',
            rateLimitPerMin: 60,
            enabled: true,
            requiresAuth: true,
            latencyMs: 34,
            totalCalls24h: 185000,
            errorCount24h: 3,
          },
          {
            id: 'ep-community-post-create',
            method: 'POST',
            path: '/v1/posts',
            module: 'Community',
            description: '신규 커뮤니티 글 작성 및 첨부 사진 업로드',
            rateLimitPerMin: 10,
            enabled: true,
            requiresAuth: true,
            latencyMs: 82,
            totalCalls24h: 8900,
            errorCount24h: 1,
          },

          // Store & Payments
          {
            id: 'ep-store-products',
            method: 'GET',
            path: '/v1/store/point-products',
            module: 'Store',
            description: '온(ON) 포인트 충전 상품 목록 및 단가 조회',
            rateLimitPerMin: 60,
            enabled: true,
            requiresAuth: false,
            latencyMs: 16,
            totalCalls24h: 98000,
            errorCount24h: 0,
          },
          {
            id: 'ep-store-charge',
            method: 'POST',
            path: '/v1/store/charge/verify',
            module: 'Store',
            description: '토스/포트원 인앱결제 영수증 최종 검증 및 포인트 즉시 적립',
            rateLimitPerMin: 10,
            enabled: true,
            requiresAuth: true,
            latencyMs: 110,
            totalCalls24h: 14500,
            errorCount24h: 2,
          },

          // Safety & Reports
          {
            id: 'ep-safety-report',
            method: 'POST',
            path: '/v1/reports',
            module: 'Safety',
            description: '유저 및 유해 게시글 2단계 심층 신고 접수',
            rateLimitPerMin: 10,
            enabled: true,
            requiresAuth: true,
            latencyMs: 54,
            totalCalls24h: 4200,
            errorCount24h: 0,
          },
          {
            id: 'ep-safety-snapshot-webhook',
            method: 'POST',
            path: '/v1/streaming/webhook/snapshot',
            module: 'Safety',
            description: 'Agora 클라우드 녹화 스냅샷 수신 및 AI Gemini Flash 분석 파이프라인',
            rateLimitPerMin: 120,
            enabled: true,
            requiresAuth: false,
            latencyMs: 95,
            totalCalls24h: 68000,
            errorCount24h: 4,
          },
        ];
        fs.writeFileSync(this.endpointsFile, JSON.stringify(defaultEndpoints, null, 2), 'utf-8');
      }

      if (!fs.existsSync(this.logsFile)) {
        const defaultLogs: ApiTrafficLog[] = [
          {
            id: 'log-1001',
            timestamp: new Date().toLocaleTimeString('ko-KR'),
            method: 'POST',
            path: '/v1/calls/private/initiate',
            statusCode: 200,
            latencyMs: 62,
            clientIp: '121.134.82.11',
            userAgent: 'Dagaon/1.2.0 (Android 14; Galaxy S24)',
          },
          {
            id: 'log-1002',
            timestamp: new Date(Date.now() - 2000).toLocaleTimeString('ko-KR'),
            method: 'GET',
            path: '/v1/discover',
            statusCode: 200,
            latencyMs: 29,
            clientIp: '211.234.110.45',
            userAgent: 'Dagaon/1.2.0 (iOS 17.5; iPhone 15 Pro)',
          },
          {
            id: 'log-1003',
            timestamp: new Date(Date.now() - 5000).toLocaleTimeString('ko-KR'),
            method: 'POST',
            path: '/v1/chats/room-882/messages',
            statusCode: 200,
            latencyMs: 34,
            clientIp: '175.223.18.90',
            userAgent: 'Dagaon/1.2.0 (Android 13; Galaxy A54)',
          },
          {
            id: 'log-1004',
            timestamp: new Date(Date.now() - 9000).toLocaleTimeString('ko-KR'),
            method: 'POST',
            path: '/v1/store/charge/verify',
            statusCode: 200,
            latencyMs: 112,
            clientIp: '220.89.14.77',
            userAgent: 'Dagaon/1.2.0 (iOS 17.4; iPhone 14)',
          },
          {
            id: 'log-1005',
            timestamp: new Date(Date.now() - 14000).toLocaleTimeString('ko-KR'),
            method: 'POST',
            path: '/v1/streaming/webhook/snapshot',
            statusCode: 200,
            latencyMs: 91,
            clientIp: '34.64.120.8',
            userAgent: 'Agora-Cloud-Recorder/3.0',
          },
        ];
        fs.writeFileSync(this.logsFile, JSON.stringify(defaultLogs, null, 2), 'utf-8');
      }
    } catch (err) {
      this.logger.error('Failed to initialize api-manager data files', err);
    }
  }

  private readEndpoints(): ApiEndpointItem[] {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(this.endpointsFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Failed to read endpoints file', err);
      return [];
    }
  }

  private writeEndpoints(data: ApiEndpointItem[]) {
    try {
      fs.writeFileSync(this.endpointsFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      this.logger.error('Failed to write endpoints file', err);
    }
  }

  private readLogs(): ApiTrafficLog[] {
    try {
      this.ensureDataFiles();
      const content = fs.readFileSync(this.logsFile, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      this.logger.error('Failed to read logs file', err);
      return [];
    }
  }

  getSnapshot() {
    const endpoints = this.readEndpoints();
    const recentLogs = this.readLogs();

    const totalRequests24h = endpoints.reduce((acc, ep) => acc + (ep.totalCalls24h || 0), 0);
    const totalErrors24h = endpoints.reduce((acc, ep) => acc + (ep.errorCount24h || 0), 0);
    const errorRate24h = totalRequests24h > 0 ? Number(((totalErrors24h / totalRequests24h) * 100).toFixed(2)) : 0.08;
    const avgLatencyMs = endpoints.length > 0 ? Math.round(endpoints.reduce((acc, ep) => acc + ep.latencyMs, 0) / endpoints.length) : 42;

    const externalServices: ExternalServiceHealth[] = [
      { name: 'Agora RTC Engine', status: 'OPERATIONAL', latencyMs: 24, uptime: '99.99%', lastChecked: '방금 전' },
      { name: 'Google Gemini 1.5 Flash Vision', status: 'OPERATIONAL', latencyMs: 380, uptime: '99.95%', lastChecked: '방금 전' },
      { name: 'Toss Payments API', status: 'OPERATIONAL', latencyMs: 85, uptime: '99.98%', lastChecked: '방금 전' },
      { name: 'Firebase Cloud Messaging (FCM)', status: 'OPERATIONAL', latencyMs: 42, uptime: '99.97%', lastChecked: '방금 전' },
      { name: 'Supabase PostgreSQL DB', status: 'OPERATIONAL', latencyMs: 8, uptime: '100%', lastChecked: '방금 전' },
    ];

    return {
      endpoints,
      recentLogs,
      totalRequests24h,
      errorRate24h,
      avgLatencyMs,
      externalServices,
    };
  }

  updateEndpoint(id: string, payload: Partial<ApiEndpointItem>) {
    const endpoints = this.readEndpoints();
    const idx = endpoints.findIndex((ep) => ep.id === id);
    if (idx === -1) return null;

    endpoints[idx] = { ...endpoints[idx], ...payload };
    this.writeEndpoints(endpoints);
    return endpoints[idx];
  }

  pingEndpoint(id: string) {
    const endpoints = this.readEndpoints();
    const ep = endpoints.find((e) => e.id === id);
    if (!ep) return null;

    // Simulate real ping with realistic variance
    const jitter = Math.floor(Math.random() * 14) - 7;
    const measuredLatency = Math.max(8, ep.latencyMs + jitter);
    ep.latencyMs = measuredLatency;
    this.writeEndpoints(endpoints);

    return {
      id: ep.id,
      path: ep.path,
      statusCode: ep.enabled ? 200 : 503,
      latencyMs: measuredLatency,
      message: ep.enabled ? '정상 응답 (OK)' : '서비스 일시 중단 (503 Service Unavailable)',
      checkedAt: new Date().toLocaleTimeString('ko-KR'),
    };
  }

  createEndpoint(dto: Partial<ApiEndpointItem>) {
    const endpoints = this.readEndpoints();
    const newEp: ApiEndpointItem = {
      id: `ep-${Date.now().toString().slice(-6)}`,
      method: dto.method || 'GET',
      path: dto.path || '/v1/custom',
      module: dto.module || 'Users',
      description: dto.description || '신규 커스텀 API 엔드포인트',
      rateLimitPerMin: dto.rateLimitPerMin || 60,
      enabled: dto.enabled !== undefined ? dto.enabled : true,
      requiresAuth: Boolean(dto.requiresAuth),
      latencyMs: 25,
      totalCalls24h: 0,
      errorCount24h: 0,
    };
    endpoints.push(newEp);
    this.writeEndpoints(endpoints);
    return newEp;
  }

  deleteEndpoint(id: string) {
    const endpoints = this.readEndpoints();
    const filtered = endpoints.filter((ep) => ep.id !== id);
    this.writeEndpoints(filtered);
    return { success: true };
  }
}
