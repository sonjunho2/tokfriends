import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { Public } from './modules/auth/public.decorator';
import { ChatService } from './modules/chat/chat.service';
import * as fs from 'fs';
import * as path from 'path';

@Controller()
export class AppController {
  private readonly matchSettingsFile = path.resolve(process.cwd(), 'data', 'match-settings.json');
  private matchSettingsCache: any = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {
    this.loadMatchSettings();
  }

  private loadMatchSettings() {
    try {
      const dir = path.dirname(this.matchSettingsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      if (fs.existsSync(this.matchSettingsFile)) {
        const raw = fs.readFileSync(this.matchSettingsFile, 'utf-8');
        this.matchSettingsCache = JSON.parse(raw);
      }
    } catch {}

    if (!this.matchSettingsCache || !Array.isArray(this.matchSettingsCache.quickFilters)) {
      this.matchSettingsCache = {
        quickFilters: [
          { id: 'T1', label: '지금 접속중', segment: '접속중', description: '최근 5분 내 접속한 실시간 활성 회원', enabled: true, icon: '🔥' },
          { id: 'T2', label: '가까운 동네', segment: '가까운 거리', description: '내 반경 5km 이내 가까운 이웃 친구', enabled: true, icon: '📍' },
          { id: 'T3', label: '20대 또래', segment: '연령대', description: '20~29세 공감대 높은 또래 친구', enabled: true, icon: '🎂' },
          { id: 'T4', label: '취미·운동', segment: '의도', description: '헬스, 러닝, 등산 관심사 회원', enabled: true, icon: '🏃' },
          { id: 'T5', label: '가벼운 커피', segment: '의도', description: '카페 투어 및 편안한 동네 수다', enabled: true, icon: '☕' },
        ],
        weights: { distance: 30, interest: 30, recency: 20, aiAffinity: 20 },
      };
      this.saveMatchSettings();
    }
  }

  private saveMatchSettings() {
    try {
      const dir = path.dirname(this.matchSettingsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.matchSettingsFile, JSON.stringify(this.matchSettingsCache, null, 2), 'utf-8');
    } catch {}
  }


  @Public()
  @Get()

  redirectToDocs(@Res() res: Response) {
    return res.redirect('/docs');
  }

  @Public()
  @Get('metrics/dashboard')
  async getDashboardMetrics() {
    const [totalUsers, activeUsers, totalCalls, totalReports] = await Promise.all([
      this.prisma.user.count().catch(() => 0),
      this.prisma.user.count({ where: { status: 'active' } }).catch(() => 0),
      this.prisma.privateCallSession.count().catch(() => 0),
      (this.prisma as any).report ? (this.prisma as any).report.count().catch(() => 0) : 0,
    ]);

    return {
      totalUsers: Math.max(totalUsers, 1),
      activeUsers: Math.max(activeUsers, 1),
      matchRequests: totalCalls,
      reports: totalReports,
      userGrowth: '+12.4%',
      matchGrowth: '+8.7%',
      reportSla: '98.5%',
    };
  }

  @Public()
  @Get('matches/control-panel')
  async getMatchControlPanel() {
    this.loadMatchSettings();
    return {
      queueStats: [
        { id: 'SEG-1', segment: '서울/수도권 활성 회원', waiting: 84, medianWait: '00:32', dropOffRate: '3.1%' },
        { id: 'SEG-2', segment: '부산/영남 취향 모임', waiting: 42, medianWait: '00:54', dropOffRate: '4.8%' },
        { id: 'SEG-3', segment: '심야 실시간 대화', waiting: 28, medianWait: '01:10', dropOffRate: '5.2%' },
        { id: 'SEG-4', segment: '신규 가입 환영 세그먼트', waiting: 112, medianWait: '00:45', dropOffRate: '2.9%' },
      ],
      presets: [
        {
          id: 'preset-balanced',
          name: '황금 밸런스 추천',
          isActive: true,
          weights: this.matchSettingsCache.weights,
          createdAt: new Date().toISOString(),
          author: '관리자 설정',
        },
      ],
      quickFilters: this.matchSettingsCache.quickFilters,
      recommendationPools: [
        { id: 'POOL1', title: 'HOT 인기 추천', sortRule: '관심도 + 대화수 + 호감도', metrics: '매칭 성공률 92%', owner: 'AI 추천 엔진' },
        { id: 'POOL2', title: '실시간 접속 중', sortRule: '최근 로그인 순 정렬', metrics: '응답률 96%', owner: '플랫폼 팀' },
        { id: 'POOL3', title: '동네 근처 친구', sortRule: 'GPS 거리 오름차순', metrics: '첫 대화 전환 84%', owner: '매칭 팀' },
      ],
    };
  }

  @Public()
  @Get('matches/quick-filters')
  async getActiveQuickFilters() {
    this.loadMatchSettings();
    const active = (this.matchSettingsCache.quickFilters || []).filter((f: any) => f.enabled !== false);
    return { ok: true, data: active, items: active };
  }

  @Public()
  @Post('matches/quick-filters')
  async createMatchQuickFilter(@Body() body: any) {
    this.loadMatchSettings();
    const newFilter = {
      id: `T-${Date.now()}`,
      label: body.label || '새 태그',
      segment: body.segment || '의도',
      description: body.description || '',
      enabled: true,
      icon: body.icon || (body.label?.startsWith('🔥') ? '🔥' : body.label?.startsWith('📍') ? '📍' : body.label?.startsWith('🎂') ? '🎂' : '✨'),
    };
    this.matchSettingsCache.quickFilters.unshift(newFilter);
    this.saveMatchSettings();
    return newFilter;
  }

  @Public()
  @Patch('matches/quick-filters/:id')
  async updateMatchQuickFilter(@Param('id') id: string, @Body() body: any) {
    this.loadMatchSettings();
    const item = this.matchSettingsCache.quickFilters.find((f: any) => f.id === id);
    if (item) {
      if (body.enabled !== undefined) item.enabled = Boolean(body.enabled);
      if (body.label !== undefined) item.label = body.label;
      if (body.description !== undefined) item.description = body.description;
      if (body.segment !== undefined) item.segment = body.segment;
      this.saveMatchSettings();
      return { ok: true, data: item };
    }
    return { ok: false, error: '태그를 찾을 수 없습니다.' };
  }

  @Public()
  @Delete('matches/quick-filters/:id')
  async deleteMatchQuickFilter(@Param('id') id: string) {
    this.loadMatchSettings();
    this.matchSettingsCache.quickFilters = this.matchSettingsCache.quickFilters.filter(
      (f: any) => f.id !== id,
    );
    this.saveMatchSettings();
    return { ok: true, id };
  }

  @Public()
  @Patch('matches/presets/:id')
  async updateMatchPreset(@Param('id') id: string, @Body() body: any) {
    this.loadMatchSettings();
    if (body.weights) {
      this.matchSettingsCache.weights = {
        distance: Number(body.weights.distance ?? 30),
        interest: Number(body.weights.interest ?? 30),
        recency: Number(body.weights.recency ?? 20),
        aiAffinity: Number(body.weights.aiAffinity ?? 20),
      };
      this.saveMatchSettings();
    }
    return {
      id,
      name: body.name || '맞춤 프리셋',
      isActive: true,
      weights: this.matchSettingsCache.weights,
      createdAt: new Date().toISOString(),
      author: '관리자',
    };
  }

  @Public()
  @Get('chats/control-panel')
  async getChatControlPanel() {
    const liveRooms = this.chatService.getAllRoomsForAdmin();
    return {
      rooms: [
        ...liveRooms,
        {
          id: 'CHAT-101',
          title: '이지민 ↔ 김철수',
          category: '1:1 대화',
          region: '서울 강남구',
          distanceKm: 1.2,
          unread: 0,
          newMessages: 18,
          participants: 2,
          status: 'NEEDS_REVIEW',
          createdAt: '2026-10-15 10:12',
          lastMessageAt: '2026-10-15 10:45',
          lastMessage: '카톡으로 연락하실래요? 제 아이디는 chulsoo_99 입니다!',
          flaggedReason: '외부 연락처 유도 감지',
          userA: { id: 'u1', nickname: '이지민', age: 24, gender: '여', region: '서울 강남구', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120' },
          userB: { id: 'u2', nickname: '김철수', age: 28, gender: '남', region: '서울 서초구', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120' },
          messages: [
            { id: 'm1', senderId: 'u1', senderName: '이지민', text: '안녕하세요 철수님! 오늘 강남 쪽 날씨 좋네요 :)', time: '10:15', isFlagged: false },
            { id: 'm2', senderId: 'u2', senderName: '김철수', text: '네 지민님! 프로필 사진 분위기 너무 좋으세요!', time: '10:18', isFlagged: false },
            { id: 'm3', senderId: 'u2', senderName: '김철수', type: 'GIFT', giftName: '하트 10개 (1,000온)', time: '10:20', isFlagged: false },
            { id: 'm4', senderId: 'u1', senderName: '이지민', text: '앗 하트 선물 감사합니다 ㅎㅎ 퇴근하고 보통 뭐 하세요?', time: '10:25', isFlagged: false },
            { id: 'm5', senderId: 'u2', senderName: '김철수', text: '혹시 여기서 대화하기 불편한데 카톡으로 연락하실래요? 제 아이디는 chulsoo_99 입니다!', time: '10:45', isFlagged: true, flagNotice: '외부 메신저(카카오톡 ID) 유도 감지' },
          ],
        },
        {
          id: 'CHAT-102',
          title: '박민수 ↔ 서연',
          category: '1:1 대화',
          region: '부산 해운대구',
          distanceKm: 2.8,
          unread: 0,
          newMessages: 42,
          participants: 2,
          status: 'ACTIVE',
          createdAt: '2026-10-14 18:30',
          lastMessageAt: '2026-10-15 09:20',
          lastMessage: '네! 저도 그 밴드 음악 좋아해요 :)',
          userA: { id: 'u3', nickname: '박민수', age: 27, gender: '남', region: '부산 해운대구', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120' },
          userB: { id: 'u4', nickname: '서연', age: 25, gender: '여', region: '부산 수영구', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120' },
          messages: [
            { id: 'm201', senderId: 'u3', senderName: '박민수', text: '서연님 피드에 올리신 인디밴드 공연 영상 잘 봤어요!', time: '어제 18:30', isFlagged: false },
            { id: 'm202', senderId: 'u4', senderName: '서연', text: '어 정말요? 그 밴드 아시는 분 드문데 너무 반가워요!', time: '어제 18:35', isFlagged: false },
            { id: 'm203', senderId: 'u3', senderName: '박민수', text: '네! 저도 그 밴드 음악 좋아해요 :) 다음에 서울이나 부산 공연 있으면 가보려구요', time: '09:20', isFlagged: false },
          ],
        },
        {
          id: 'CHAT-103',
          title: '최유진 ↔ 정우성',
          category: '1:1 대화',
          region: '대구 수성구',
          distanceKm: 3.5,
          unread: 0,
          newMessages: 8,
          participants: 2,
          status: 'NEEDS_REVIEW',
          createdAt: '2026-10-15 08:20',
          lastMessageAt: '2026-10-15 09:12',
          lastMessage: '신한 110-382-XXXXXX 계좌로 먼저 입금해주시면...',
          flaggedReason: '금전 및 사기 계좌 요구 의심',
          userA: { id: 'u5', nickname: '최유진', age: 23, gender: '여', region: '대구 수성구', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120' },
          userB: { id: 'u6', nickname: '정우성', age: 31, gender: '남', region: '대구 중구', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120' },
          messages: [
            { id: 'm301', senderId: 'u5', senderName: '최유진', text: '프로필에 라이브 방송 보러오시라고 적혀있어서 연락드렸어요!', time: '08:20', isFlagged: false },
            { id: 'm302', senderId: 'u6', senderName: '정우성', text: '아 네 환영합니다! 혹시 비공개 이벤트 참여 원하시면 티켓비 지원해주셔야 해요', time: '08:35', isFlagged: false },
            { id: 'm303', senderId: 'u6', senderName: '정우성', text: '신한 110-382-XXXXXX 계좌로 먼저 입금해주시면 VIP 초대 링크 보내드릴게요', time: '09:12', isFlagged: true, flagNotice: '외부 계좌번호 및 금전 입금 요구 탐지' },
          ],
        },
        {
          id: 'CHAT-104',
          title: '강도윤 ↔ 한수아',
          category: '1:1 대화',
          region: '인천 연수구',
          distanceKm: 4.1,
          unread: 0,
          newMessages: 0,
          participants: 2,
          status: 'ARCHIVED',
          createdAt: '2026-10-14 11:00',
          lastMessageAt: '2026-10-14 14:20',
          lastMessage: '관리자에 의해 [24시간 1:1 대화 정지] 조치가 적용되었습니다.',
          flaggedReason: '비속어 사용으로 제재 완료',
          userA: { id: 'u7', nickname: '강도윤', age: 29, gender: '남', region: '인천 연수구', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120' },
          userB: { id: 'u8', nickname: '한수아', age: 26, gender: '여', region: '인천 남동구', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120' },
          messages: [
            { id: 'm401', senderId: 'u7', senderName: '강도윤', text: '야 말귀 못 알아듣냐? ㅋㅋㅋ', time: '14:15', isFlagged: true, flagNotice: '비속어/모욕성 표현 감지' },
            { id: 'm402', senderId: 'system', senderName: '시스템', text: '🚨 운영 원칙 위반으로 인해 해당 계정의 1:1 대화 전송이 24시간 동안 정지되었습니다.', time: '14:20', isFlagged: false },
          ],
        },
      ],
      reports: [
        {
          id: 'REP-1001',
          roomId: 'CHAT-101',
          reporter: '이지민 (010-3210-XXXX)',
          target: '김철수 (010-8821-XXXX)',
          reason: '외부 메신저(카카오톡) 연락처 유도 및 집요한 요구',
          status: 'PENDING',
          createdAt: '2026-10-15 10:46',
        },
        {
          id: 'REP-1002',
          roomId: 'CHAT-103',
          reporter: '최유진 (010-5624-XXXX)',
          target: '정우성 (010-7712-XXXX)',
          reason: '타계좌 입금 유도 및 금전 사기 의심',
          status: 'IN_PROGRESS',
          createdAt: '2026-10-15 09:15',
        },
      ],
      policyRules: [
        {
          id: 'rule-keyword',
          name: '금칙어 및 욕설 자동 감지',
          description: '비속어, 성희롱 키워드 감지 시 실시간 마스킹(***) 및 경고 발송',
          enabled: true,
          autoAction: '자동 마스킹 + AI 경고 알림',
        },
        {
          id: 'rule-contact-leak',
          name: '외부 연락처 및 계좌번호 탐지',
          description: '전화번호, 카카오톡 ID, 은행 계좌 형태의 텍스트 감지 시 관리자 큐 전송',
          enabled: true,
          autoAction: '관리자 신고 큐 자동 상신',
        },
        {
          id: 'rule-repeat-report',
          name: '신고 누적 회원 자동 이용 제한',
          description: '동일 회원 대상 신고 3회 누적 시 24시간 1:1 대화 전송 차단',
          enabled: true,
          autoAction: '24시간 1:1 채팅 차단',
        },
      ],
      memo: '',
    };
  }

  @Public()
  @Post('chats/reports/:id/resolve')
  async resolveChatReport(@Param('id') id: string, @Body() body: any) {
    return { ok: true, id, action: body.action || 'RESOLVED' };
  }

  @Public()
  @Patch('chats/rooms/:id')
  async updateChatRoom(@Param('id') id: string, @Body() body: any) {
    if (body.status === 'DELETED' || body.status === 'TERMINATED') {
      await this.chatService.deleteChat('admin', id);
    }
    return { ok: true, id, ...body };
  }

  @Public()
  @Delete('chats/rooms/:id')
  async deleteChatRoomAdmin(@Param('id') id: string) {
    await this.chatService.deleteChat('admin', id);
    return { ok: true, id };
  }


  @Public()
  @Patch('chats/policy-rules/:id')
  async updateChatPolicyRule(@Param('id') id: string, @Body() body: any) {
    return { ok: true, id, ...body };
  }

  @Public()
  @Post('chats/control-panel/memo')
  async saveChatSafetyMemo(@Body() body: any) {
    return { memo: body.memo || '' };
  }
}
