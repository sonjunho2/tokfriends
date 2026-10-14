import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

export interface AiStaffMetric {
  id: string;
  name: string;
  role: string;
  status: 'ONLINE' | 'ACTIVE' | 'PROCESSING' | 'IDLE';
  processedCount: number;
  lastActive: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/admin-ws',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AdminGateway.name);

  // 5인 전문 AI 직원 + 1팀장 실시간 현황
  private staffMetrics: Record<string, AiStaffMetric> = {
    director: {
      id: 'director',
      name: '총괄 팀장 AI',
      role: 'Cross-Check & 결재안 작성',
      status: 'ONLINE',
      processedCount: 142,
      lastActive: new Date().toISOString(),
    },
    zev: {
      id: 'zev',
      name: '제브 AI (Zev)',
      role: '정보통신망법 규정 기계적 판정',
      status: 'ONLINE',
      processedCount: 189,
      lastActive: new Date().toISOString(),
    },
    safety: {
      id: 'safety',
      name: '안전관 (Safety)',
      role: 'Gemini 1.5 Flash Vision 실시간 스크리닝',
      status: 'ACTIVE',
      processedCount: 8420,
      lastActive: new Date().toISOString(),
    },
    auditor: {
      id: 'auditor',
      name: '감사관 (Auditor)',
      role: '계정 이력 및 맥락 교차 감사',
      status: 'ONLINE',
      processedCount: 312,
      lastActive: new Date().toISOString(),
    },
    cs: {
      id: 'cs',
      name: 'CS관 (Support)',
      role: '피해자 보호 & 제재 통지 초안',
      status: 'IDLE',
      processedCount: 95,
      lastActive: new Date().toISOString(),
    },
    growth: {
      id: 'growth',
      name: '성장관 (Growth)',
      role: '방송 룸 리스크 영향도 분석',
      status: 'ONLINE',
      processedCount: 118,
      lastActive: new Date().toISOString(),
    },
  };

  handleConnection(client: Socket) {
    this.logger.log(`Admin client connected: ${client.id}`);
    // 초기 AI 직원 상태 전송
    client.emit('AI_STAFF_METRICS', Object.values(this.staffMetrics));
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Admin client disconnected: ${client.id}`);
  }

  getStaffMetrics(): AiStaffMetric[] {
    return Object.values(this.staffMetrics);
  }

  incrementProcessed(staffId: keyof typeof this.staffMetrics) {
    if (this.staffMetrics[staffId]) {
      this.staffMetrics[staffId].processedCount += 1;
      this.staffMetrics[staffId].lastActive = new Date().toISOString();
      this.staffMetrics[staffId].status = 'PROCESSING';
      this.server?.emit('AI_STAFF_METRICS', Object.values(this.staffMetrics));

      setTimeout(() => {
        if (this.staffMetrics[staffId]) {
          this.staffMetrics[staffId].status = 'ONLINE';
          this.server?.emit('AI_STAFF_METRICS', Object.values(this.staffMetrics));
        }
      }, 3000);
    }
  }

  broadcastNewDecision(decision: any) {
    this.logger.log(`[AdminGateway] 새 AI 결재 안건 푸시: #${decision.id}`);
    this.server?.emit('AI_DECISION_NEW', decision);
  }

  broadcastDecisionUpdated(decision: any) {
    this.logger.log(`[AdminGateway] AI 결재 안건 갱신: #${decision.id}`);
    this.server?.emit('AI_DECISION_UPDATED', decision);
  }
}
