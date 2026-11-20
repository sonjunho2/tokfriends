import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ChatGateway } from '../ws/chat.gateway';
import { OrchestratorService } from '../ai-staff/orchestrator.service';
import * as fs from 'fs';
import * as path from 'path';

export interface ChatMessageItem {
  id: string;
  chatId: string;
  senderAccountId: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  type: string;
  createdAt: string;
  readAt?: string | null;
  giftPoints?: number | null;
  giftName?: string | null;
  giftIcon?: string | null;
  isFlagged?: boolean;
  flagNotice?: string | null;
}

export interface ChatRoomItem {
  id: string;
  title: string;
  category: string;
  entryFee: number;
  isGroup: boolean;
  participantIds: string[];
  hostId?: string;
  creatorId?: string;
  host?: {
    id: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  counterpart?: {
    id: string;
    displayName: string;
    handle?: string;
    avatarUrl?: string | null;
    online?: boolean;
  } | null;
  isWaiting?: boolean;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'NEEDS_REVIEW' | 'FLAGGED' | 'CLOSED';
  deletedAt?: string | null;
  retentionUntil?: string | null;
  retentionBasis?: string | null;
  flaggedReason?: string | null;
}

export interface ChatSafetyPolicyRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  autoAction: string;
}

export interface ChatSafetyReport {
  id: string;
  roomId: string;
  roomTitle: string;
  reporterName: string;
  targetUserName: string;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface OpenChatRoomItem {
  id: string;
  title: string;
  category: string;
  entryFee: number;
  hostId: string;
  hostName: string;
  hostAvatar?: string | null;
  hostAge?: number;
  hostRegion?: string;
  hostGender?: string;
  createdAt: string;
  matchedCount: number;
}

export interface ChatRequestItem {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  senderAge?: number;
  senderRegion?: string;
  receiverId: string;
  message?: string;
  entryFee: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  chatRoomId?: string | null;
}

@Injectable()
export class ChatService implements OnModuleInit {
  private readonly logger = new Logger(ChatService.name);
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly chatsFilePath = path.join(this.dataDir, 'chats.json');
  private readonly archivedChatsFilePath = path.join(this.dataDir, 'chats-archive.json');
  private readonly messagesFilePath = path.join(this.dataDir, 'chat-messages.json');
  private readonly openRoomsFilePath = path.join(this.dataDir, 'open-rooms.json');
  private readonly chatRequestsFilePath = path.join(this.dataDir, 'chat-requests.json');
  private readonly safetyPolicyFilePath = path.join(this.dataDir, 'chat-safety-policy.json');

  private openRooms: OpenChatRoomItem[] = [
    {
      id: 'open-room-1',
      title: '오늘 저녁 한강 러닝 코스 같이 달려요 🏃',
      category: '운동',
      entryFee: 30,
      hostId: 'u-seed-2',
      hostName: '김도현',
      hostAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      hostAge: 29,
      hostRegion: '서울 강남구',
      hostGender: '남',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      matchedCount: 3,
    },
    {
      id: 'open-room-2',
      title: '성수동 빈티지 카페 탐방 & 감성 수다 ☕',
      category: '친목',
      entryFee: 50,
      hostId: 'u-seed-1',
      hostName: '박서연',
      hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      hostAge: 26,
      hostRegion: '서울 성동구',
      hostGender: '여',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      matchedCount: 5,
    },
    {
      id: 'open-room-3',
      title: '귀여운 댕댕이 사진 공유하고 힐링할 분 🐶',
      category: '반려견',
      entryFee: 0,
      hostId: 'u-seed-5',
      hostName: '한유진',
      hostAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      hostAge: 25,
      hostRegion: '서울 마포구',
      hostGender: '여',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      matchedCount: 2,
    },
    {
      id: 'open-room-4',
      title: '주말 테니스 & 배드민턴 랠리 파트너 구해요 🏸',
      category: '취미',
      entryFee: 20,
      hostId: 'u-seed-4',
      hostName: '이지민',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      hostAge: 27,
      hostRegion: '서울 송파구',
      hostGender: '여',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      matchedCount: 1,
    },
  ];

  private chatRequests: ChatRequestItem[] = [
    {
      id: 'req-mock-1',
      senderId: 'u-seed-4',
      senderName: '이지민',
      senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      senderAge: 27,
      senderRegion: '서울 송파구',
      receiverId: 'guest',
      message: '안녕하세요! 프로필 사진 보고 취향이 잘 맞을 것 같아 대화 신청드려요 ✨ 주말에 편하게 톡 나눠요!',
      entryFee: 50,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'req-mock-2',
      senderId: 'u-seed-6',
      senderName: '강민호',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
      senderAge: 30,
      senderRegion: '서울 서초구',
      receiverId: 'guest',
      message: '동네 러닝 크루나 운동 같이 하실 분 찾고 있어요 🏃 대화 가능하신가요?',
      entryFee: 30,
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    },
  ];

  private rooms: ChatRoomItem[] = [
    {
      id: 'chat-mock-1',
      title: '박서연',
      category: '친목',
      entryFee: 0,
      isGroup: false,
      participantIds: ['guest', 'u-seed-1', 'acc-seoyeon'],
      counterpart: {
        id: 'u-seed-1',
        displayName: '박서연',
        handle: 'seoyeon_art',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        online: true,
      },
      lastMessage: '네! 주말에 역삼역 근처 카페에서 봬요 ✨',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      unreadCount: 2,
      createdAt: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    },
    {
      id: 'chat-mock-2',
      title: '김도현',
      category: '운동',
      entryFee: 0,
      isGroup: false,
      participantIds: ['guest', 'u-seed-2', 'acc-dohyun'],
      counterpart: {
        id: 'u-seed-2',
        displayName: '김도현',
        handle: 'dohyun_run',
        avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        online: true,
      },
      lastMessage: '오늘 저녁 한강 러닝 코스 어떠세요?',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      unreadCount: 0,
      createdAt: new Date(Date.now() - 1000 * 3600 * 48).toISOString(),
    },
    {
      id: 'chat-mock-3',
      title: '한유진',
      category: '반려견',
      entryFee: 0,
      isGroup: false,
      participantIds: ['guest', 'u-seed-5', 'acc-yujin'],
      counterpart: {
        id: 'u-seed-5',
        displayName: '한유진',
        handle: 'yujin_puppy',
        avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        online: false,
      },
      lastMessage: '사진 속 강아지가 너무 귀여워요 🐶',
      lastMessageAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      unreadCount: 0,
      createdAt: new Date(Date.now() - 1000 * 3600 * 72).toISOString(),
    },
  ];

  private messagesStore: Record<string, ChatMessageItem[]> = {
    'chat-mock-1': [
      {
        id: 'msg-101',
        chatId: 'chat-mock-1',
        senderAccountId: 'u-seed-1',
        senderName: '박서연',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        content: '안녕하세요! 모꼬에서 프로필 보고 인사드려요 👋',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
      },
      {
        id: 'msg-102',
        chatId: 'chat-mock-1',
        senderAccountId: 'guest',
        senderName: '나',
        content: '반가워요 서연님! 저도 전시회랑 카페 투어 좋아해요 ☕',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
      },
      {
        id: 'msg-103',
        chatId: 'chat-mock-1',
        senderAccountId: 'u-seed-1',
        senderName: '박서연',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
        content: '네! 주말에 역삼역 근처 카페에서 봬요 ✨',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
    ],
    'chat-mock-2': [
      {
        id: 'msg-201',
        chatId: 'chat-mock-2',
        senderAccountId: 'u-seed-2',
        senderName: '김도현',
        senderAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
        content: '오늘 저녁 한강 러닝 코스 어떠세요?',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      },
    ],
    'chat-mock-3': [
      {
        id: 'msg-301',
        chatId: 'chat-mock-3',
        senderAccountId: 'u-seed-5',
        senderName: '한유진',
        senderAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
        content: '사진 속 강아지가 너무 귀여워요 🐶',
        type: 'text',
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ],
  };

  private archivedRooms: ChatRoomItem[] = [];

  private policyRules: ChatSafetyPolicyRule[] = [
    {
      id: 'rule-keyword',
      name: '금칙어 및 욕설 자동 감지',
      description: '비속어, 성희롱 키워드 감지 시 실시간 마스킹(***) 및 경고 발송',
      enabled: true,
      autoAction: '자동 마스킹 + AI 경고 알림',
    },
    {
      id: 'rule-contact-leak',
      name: '외부 연락처/메신저 유도 차단',
      description: '카카오톡, 라인, 텔레그램, 전화번호 등 플랫폼 이탈 유도 감지 시 관리자 큐 전송',
      enabled: true,
      autoAction: '경고 발송 및 관리자 검토 큐 등록',
    },
    {
      id: 'rule-fraud-money',
      name: '금전 요구 및 조건만남 사기 방지',
      description: '계좌번호, 입금 유도, 대출, 조건만남 관련 이상 대화 즉시 플래깅',
      enabled: true,
      autoAction: '대화 일시 정지 및 AI 안전 심사',
    },
    {
      id: 'rule-media-scan',
      name: '첨부 미디어 AI 유해성 스캔',
      description: '사진 전송 시 Vision API를 통해 음란물/불법 콘텐츠 자동 차단',
      enabled: true,
      autoAction: '유해 이미지 즉시 블러 및 관리자 알림',
    },
  ];

  private bannedKeywords: string[] = [
    '카톡',
    '카카오톡',
    '오픈톡',
    '오픈채팅',
    '라인',
    '텔레',
    '텔레그램',
    '010-',
    '계좌',
    '입금',
    '송금',
    '비트코인',
    '코인',
    '대출',
    '사설',
    '토토',
    '조건만남',
    '스폰',
    '성매매',
    '원나잇',
    '씨발',
    '개새끼',
    '병신',
    '좆',
  ];

  private safetyMemo = '2026-11-17: 본사 AI 안전 정책 가동 중 (통신비밀보호법 3개월 및 전자상거래법 3년 법정 보존 적용)';

  private safetyReports: ChatSafetyReport[] = [
    {
      id: 'REP-1001',
      roomId: 'chat-mock-1',
      roomTitle: '박서연 ↔ 게스트',
      reporterName: 'AI 안전 감시관 (Zev)',
      targetUserName: '게스트',
      reason: '외부 연락처(메신저 ID) 유도 의심 패턴 감지',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    },
  ];

  // 🛡️ 운영자 제재 회원 인메모리 관리
  private suspendedUsers: Record<string, number> = {}; // userId / nickname -> 만료 timestamp
  private bannedUsers: Set<string> = new Set();
  private violationCounts: Record<string, number> = {}; // userId / nickname -> 누적 위반 횟수 (3진 아웃 점진적 제재)

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    @Inject(forwardRef(() => OrchestratorService))
    private readonly orchestratorService: OrchestratorService,
  ) {}

  onModuleInit() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (fs.existsSync(this.chatsFilePath)) {
        const raw = fs.readFileSync(this.chatsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.rooms = parsed;
        }
      }
      if (fs.existsSync(this.archivedChatsFilePath)) {
        const raw = fs.readFileSync(this.archivedChatsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.archivedRooms = parsed;
        }
      }
      if (fs.existsSync(this.messagesFilePath)) {
        const raw = fs.readFileSync(this.messagesFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.messagesStore = parsed;
        }
      }
      if (fs.existsSync(this.openRoomsFilePath)) {
        const raw = fs.readFileSync(this.openRoomsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.openRooms = parsed;
        }
      }
      if (fs.existsSync(this.chatRequestsFilePath)) {
        const raw = fs.readFileSync(this.chatRequestsFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.chatRequests = parsed;
        }
      }
      if (fs.existsSync(this.safetyPolicyFilePath)) {
        const raw = fs.readFileSync(this.safetyPolicyFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.policyRules) && parsed.policyRules.length > 0) {
            this.policyRules = parsed.policyRules;
          }
          if (Array.isArray(parsed.bannedKeywords) && parsed.bannedKeywords.length > 0) {
            this.bannedKeywords = parsed.bannedKeywords;
          }
          if (typeof parsed.safetyMemo === 'string' && parsed.safetyMemo) {
            this.safetyMemo = parsed.safetyMemo;
          }
          if (Array.isArray(parsed.safetyReports) && parsed.safetyReports.length > 0) {
            this.safetyReports = parsed.safetyReports;
          }
        }
      }

      // 🛡️ 기존 디스크 파일에 혹시 admin_super_user / Super Admin으로 기록된 1:1 대화방/메시지 데이터 일괄 정규화
      const isAdminAccount = (idOrName?: string) => {
        if (!idOrName) return false;
        const s = String(idOrName).trim().toLowerCase();
        return ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(s);
      };

      let hasCleaned = false;
      const cleanRoom = (r: any) => {
        if (!r) return;
        if (isAdminAccount(r.host?.displayName)) {
          r.host.displayName = '테스터02';
          hasCleaned = true;
        }
        if (isAdminAccount(r.host?.id)) {
          r.host.id = 'u-tester-02';
          hasCleaned = true;
        }
        if (isAdminAccount(r.counterpart?.displayName)) {
          r.counterpart.displayName = '테스터02';
          hasCleaned = true;
        }
        if (isAdminAccount(r.counterpart?.id)) {
          r.counterpart.id = 'u-tester-02';
          hasCleaned = true;
        }
        if (isAdminAccount(r.title)) {
          r.title = '테스터02';
          hasCleaned = true;
        }
        if (Array.isArray(r.participantIds)) {
          r.participantIds = r.participantIds.map((pid: string) => (isAdminAccount(pid) ? 'u-tester-02' : pid));
        }
      };

      this.rooms.forEach(cleanRoom);
      this.archivedRooms.forEach(cleanRoom);

      for (const cId in this.messagesStore) {
        if (Array.isArray(this.messagesStore[cId])) {
          this.messagesStore[cId].forEach((m: any) => {
            if (!m) return;
            if (isAdminAccount(m.senderName) || isAdminAccount(m.senderNickname)) {
              m.senderName = '테스터02';
              if (m.senderNickname) m.senderNickname = '테스터02';
              hasCleaned = true;
            }
            if (isAdminAccount(m.senderAccountId)) {
              m.senderAccountId = 'u-tester-02';
              hasCleaned = true;
            }
            if (typeof m.content === 'string' && m.content.includes('admin_super_user')) {
              m.content = m.content.replace(/admin_super_user/g, '테스터02');
              hasCleaned = true;
            }
          });
        }
      }

      if (hasCleaned) {
        this.saveToDisk();
      }
    } catch (e: any) {
      this.logger.warn(`Failed to load chat data from disk: ${e?.message}`);
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.chatsFilePath, JSON.stringify(this.rooms, null, 2), 'utf-8');
      fs.writeFileSync(this.archivedChatsFilePath, JSON.stringify(this.archivedRooms, null, 2), 'utf-8');
      fs.writeFileSync(this.messagesFilePath, JSON.stringify(this.messagesStore, null, 2), 'utf-8');
      fs.writeFileSync(this.openRoomsFilePath, JSON.stringify(this.openRooms, null, 2), 'utf-8');
      fs.writeFileSync(this.chatRequestsFilePath, JSON.stringify(this.chatRequests, null, 2), 'utf-8');
      fs.writeFileSync(
        this.safetyPolicyFilePath,
        JSON.stringify(
          {
            policyRules: this.policyRules,
            bannedKeywords: this.bannedKeywords,
            safetyMemo: this.safetyMemo,
            safetyReports: this.safetyReports,
          },
          null,
          2,
        ),
        'utf-8',
      );
    } catch (e: any) {
      this.logger.warn(`Failed to save chat data to disk: ${e?.message}`);
    }
  }

  async getChats(userId?: string, requestedNickname?: string): Promise<ChatRoomItem[]> {
    const sorted = [...this.rooms].sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );

    let userNickname = requestedNickname || '';
    if (userId && userId !== 'guest') {
      try {
        const u = await this.prisma.user.findFirst({
          where: { OR: [{ id: userId }, { nickname: userId }] },
        });
        if (u?.nickname) userNickname = u.nickname;
      } catch {}
    }

    // Helper: is this id or name referring to ME?
    const isMe = (val?: string | null) => {
      if (!val) return false;
      const v = String(val).trim();
      return (
        (userId && userId !== 'guest' && v === userId) ||
        (userNickname && v === userNickname) ||
        v === '나' ||
        v === 'me'
      );
    };

    const userRooms = sorted.filter((r) => {
      if ((!userId || userId === 'guest') && !userNickname) {
        return true;
      }
      return (
        r.participantIds?.some((pid) => isMe(pid)) ||
        isMe(r.hostId) ||
        isMe(r.creatorId) ||
        isMe(r.host?.id) ||
        isMe(r.host?.displayName) ||
        isMe(r.counterpart?.id) ||
        isMe(r.counterpart?.displayName) ||
        r.id.startsWith('chat-mock-')
      );
    });

    // Helper: is this an admin account name?
    const isAdminAccount = (val?: string | null) => {
      if (!val) return false;
      const v = String(val).trim().toLowerCase();
      return v === 'super admin' || v === 'admin' || v === 'admin_super_user' || v === '관리자' || v === '슈퍼어드민';
    };

    // Helper: is this a guest/me placeholder?
    const isGuestOrMePlaceholder = (val?: string | null) => {
      if (!val) return false;
      const v = String(val).trim().toLowerCase();
      return v === 'guest' || v === '나' || v === 'me' || v === '대화 상대';
    };

    const mockRoomDetails: Record<string, { name: string; avatar: string }> = {
      'chat-mock-1': {
        name: '박서연',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      },
      'chat-mock-2': {
        name: '김도현',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      },
      'chat-mock-3': {
        name: '한유진',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      },
    };

    // Compute counterpart perspective for this user
    return userRooms.map((r) => {
      // 목업 룸(박서연, 김도현, 한유진)은 원본 상대방 정보 확고하게 보존
      if (r.id.startsWith('chat-mock-')) {
        const mockInfo = mockRoomDetails[r.id] || { name: r.title || '친구', avatar: r.counterpart?.avatarUrl || '' };
        const msgs = this.messagesStore[r.id] || [];
        const computedUnread = msgs.filter(
          (m) =>
            !isMe(m.senderAccountId) &&
            !isMe(m.senderName) &&
            m.senderAccountId !== 'system' &&
            !m.readAt,
        ).length;
        return {
          ...r,
          title: mockInfo.name,
          counterpart: {
            id: r.counterpart?.id || `user-${r.id}`,
            displayName: mockInfo.name,
            avatarUrl: mockInfo.avatar,
            online: true,
          },
          unreadCount: computedUnread,
        };
      }

      let otherUser = r.counterpart;
      let title = r.title;

      const hostIsMe = isMe(r.host?.id) || isMe(r.host?.displayName) || isMe(r.hostId);
      const counterpartIsMe = isMe(r.counterpart?.id) || isMe(r.counterpart?.displayName);

      if (counterpartIsMe && r.host && !hostIsMe) {
        // 내가 counterpart이면 상대방은 host!
        let hostName = r.host.displayName;
        if (isAdminAccount(hostName)) {
          hostName = '테스터02';
        }
        otherUser = {
          id: r.host.id,
          displayName: hostName,
          avatarUrl: r.host.avatarUrl,
          online: true,
        };
        title = hostName;
      } else if (hostIsMe && r.counterpart && !counterpartIsMe) {
        // 내가 host이면 상대방은 counterpart!
        let counterpartName = r.counterpart.displayName;
        if (isAdminAccount(counterpartName)) {
          counterpartName = '테스터02';
        }
        otherUser = {
          id: r.counterpart.id,
          displayName: counterpartName,
          avatarUrl: r.counterpart.avatarUrl,
          online: true,
        };
        title = counterpartName;
      } else {
        // 호스트나 카운터파트 중 내가 아닌 사람을 participantIds에서 직접 조회
        const peerId = r.participantIds?.find((pid) => !isMe(pid));
        let resolvedName = peerId;
        if (isAdminAccount(resolvedName) || isGuestOrMePlaceholder(resolvedName)) {
          resolvedName = (!isAdminAccount(r.counterpart?.displayName) && !isGuestOrMePlaceholder(r.counterpart?.displayName))
            ? r.counterpart?.displayName
            : ((!isAdminAccount(r.host?.displayName) && !isGuestOrMePlaceholder(r.host?.displayName))
                ? r.host?.displayName
                : '테스터02');
        }
        if (peerId) {
          otherUser = {
            id: peerId,
            displayName: resolvedName || '테스터02',
            avatarUrl: r.counterpart?.avatarUrl || null,
            online: true,
          };
          title = otherUser.displayName;
        }
      }

      // 방어 로직: 만약 displayName이 관리자 계정이면 '테스터02'로 정정
      if (otherUser && isAdminAccount(otherUser.displayName)) {
        otherUser = {
          ...otherUser,
          displayName: '테스터02',
        };
        title = '테스터02';
      }

      // 방어 로직: 만약 displayName이 '나'이거나 본인 이름이면 상대방으로 교체
      if (otherUser && (isMe(otherUser.displayName) || isMe(otherUser.id))) {
        const peerId = r.participantIds?.find((pid) => !isMe(pid)) || (hostIsMe ? r.counterpart?.id : r.host?.id);
        if (peerId && !isMe(peerId)) {
          let peerName = peerId;
          if (isAdminAccount(peerName)) peerName = '테스터02';
          otherUser = {
            ...otherUser,
            id: peerId,
            displayName: peerName,
          };
          title = peerName;
        }
      }

      // Compute dynamic unreadCount for current user
      const msgs = this.messagesStore[r.id] || [];
      const computedUnread = msgs.filter(
        (m) =>
          !isMe(m.senderAccountId) &&
          !isMe(m.senderName) &&
          m.senderAccountId !== 'system' &&
          !m.readAt,
      ).length;

      return {
        ...r,
        title,
        counterpart: otherUser,
        unreadCount: computedUnread,
      };
    });
  }

  getRoom(roomId: string): ChatRoomItem | undefined {
    return this.rooms.find((r) => r.id === roomId);
  }

  async getRoomById(roomId: string): Promise<ChatRoomItem> {
    const room = this.rooms.find((r) => r.id === roomId);
    if (!room) {
      throw new NotFoundException('대화방을 찾을 수 없습니다.');
    }
    return room;
  }

  markAsRead(chatId: string, userId: string): void {
    const msgs = this.messagesStore[chatId];
    const room = this.rooms.find((r) => r.id === chatId);
    if (Array.isArray(msgs)) {
      let changed = false;
      const now = new Date().toISOString();
      for (const m of msgs) {
        if (m.senderAccountId !== userId && !m.readAt) {
          m.readAt = now;
          changed = true;
        }
      }
      if (room) {
        room.unreadCount = 0;
      }
      if (changed) {
        this.saveToDisk();
      }
    }
    // 실시간 웹소켓으로 상대방에게 읽음 처리(1 숫자 제거) 브로드캐스트
    this.chatGateway.emitChatRead(chatId, userId, room?.participantIds);
  }

  async ensureDirectRoom(
    userId: string,
    targetUserId: string,
    senderNickname?: string,
    targetNickname?: string,
  ): Promise<ChatRoomItem> {
    const existing = this.rooms.find(
      (r) =>
        !r.isGroup &&
        (r.counterpart?.id === targetUserId ||
          r.counterpart?.id === targetNickname ||
          (r.participantIds?.includes(userId) && r.participantIds?.includes(targetUserId))),
    );

    const isAdminAccount = (idOrName?: string) => {
      if (!idOrName) return false;
      const s = String(idOrName).trim().toLowerCase();
      return ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(s);
    };

    let effectiveUserId = userId;
    if (isAdminAccount(effectiveUserId)) {
      effectiveUserId = 'u-tester-02';
    }

    let hostName = senderNickname || (userId && userId !== 'guest' ? userId : '회원');
    if (isAdminAccount(hostName) || isAdminAccount(userId)) {
      hostName = '테스터02';
    }
    let hostAvatar: string | null = null;
    let dbHost: any = null;
    try {
      if (!isAdminAccount(userId)) {
        dbHost = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: userId },
              { nickname: userId },
            ],
          },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
      }
      if (dbHost) {
        if (!senderNickname || isAdminAccount(senderNickname)) {
          const resolvedDbName = dbHost.nickname || dbHost.displayName;
          if (resolvedDbName && !isAdminAccount(resolvedDbName)) {
            hostName = resolvedDbName;
          } else {
            hostName = '테스터02';
          }
        } else {
          hostName = senderNickname;
        }
        hostAvatar = dbHost.avatarUrl || dbHost.photos?.[0]?.url || null;
      }
    } catch {}

    if (isAdminAccount(hostName)) {
      hostName = '테스터02';
    }

    const isAnonymousOrSelf = (name?: string) => {
      if (!name) return true;
      const s = String(name).trim().toLowerCase();
      return s === '나' || s === '나 (이웃)' || s === '이웃' || s === '대화 상대' || s === 'usr_guest' || s === 'my-user-id';
    };

    let targetName = targetNickname || (targetUserId && targetUserId !== 'guest' ? targetUserId : '대화 상대');
    if (isAdminAccount(targetName) || isAdminAccount(targetUserId)) {
      targetName = '테스터02';
    }
    if (isAnonymousOrSelf(targetName) || isAnonymousOrSelf(targetUserId)) {
      targetName = hostName === '테스터02' || effectiveUserId === 'u-tester-02' ? '테스트01' : '테스터02';
      targetUserId = targetName === '테스트01' ? 'u-tester-01' : 'u-tester-02';
    }
    let targetAvatar: string | null = null;
    let entryFee = 0;
    let u: any = null;
    try {
      if (!isAdminAccount(targetUserId)) {
        u = await this.prisma.user.findFirst({
          where: {
            OR: [
              { id: targetUserId },
              { nickname: targetUserId },
            ],
          },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
      }
      if (u) {
        const resolvedTarget = u.nickname || u.displayName;
        if (resolvedTarget && !isAdminAccount(resolvedTarget)) {
          targetName = resolvedTarget;
        }
        targetAvatar = u.avatarUrl || u.photos?.[0]?.url || null;
        entryFee = (u as any).chatEntryFee || 0;
      }
    } catch {}

    if (isAdminAccount(targetName)) {
      targetName = '테스터02';
    }

    if (existing) {
      // Fix potential '나' or admin display name bug in existing room
      if (existing.host && (!existing.host.displayName || existing.host.displayName === '나' || isAdminAccount(existing.host.displayName))) {
        existing.host.displayName = hostName;
      }
      if (isAdminAccount(existing.host?.id)) {
        existing.host.id = 'u-tester-02';
      }
      if (existing.counterpart && (!existing.counterpart.displayName || existing.counterpart.displayName === '나' || isAdminAccount(existing.counterpart.displayName))) {
        existing.counterpart.displayName = targetName;
      }
      if (isAdminAccount(existing.counterpart?.id)) {
        existing.counterpart.id = 'u-tester-02';
      }
      if (isAdminAccount(existing.title)) {
        existing.title = targetName;
      }
      return existing;
    }

    const participants = Array.from(
      new Set(
        [
          effectiveUserId,
          ...(dbHost?.id && !isAdminAccount(dbHost.id) ? [dbHost.id] : []),
          ...(dbHost?.nickname && !isAdminAccount(dbHost.nickname) ? [dbHost.nickname] : []),
          targetUserId,
          ...(u?.id && !isAdminAccount(u.id) ? [u.id] : []),
          ...(u?.nickname && !isAdminAccount(u.nickname) ? [u.nickname] : []),
        ].filter(Boolean),
      ),
    );

    const newRoom: ChatRoomItem = {
      id: `chat-direct-${Date.now()}`,
      title: targetName,
      category: '1:1',
      entryFee,
      isGroup: false,
      participantIds: participants,
      hostId: effectiveUserId,
      creatorId: effectiveUserId,
      host: {
        id: dbHost?.id && !isAdminAccount(dbHost.id) ? dbHost.id : effectiveUserId,
        displayName: hostName,
        avatarUrl: hostAvatar,
      },
      counterpart: {
        id: u?.id || targetUserId,
        displayName: targetName,
        avatarUrl: targetAvatar,
        online: true,
      },
      lastMessage: '대화가 시작되었습니다. 인사를 건네보세요!',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.rooms.unshift(newRoom);
    this.messagesStore[newRoom.id] = [
      {
        id: `msg-welcome-${Date.now()}`,
        chatId: newRoom.id,
        senderAccountId: 'system',
        content: `🎉 ${hostName && hostName !== '회원' ? `${hostName}님 & ${targetName}님의` : `${targetName}님과의`} 1:1 대화방이 열렸습니다. (입장료: ${entryFee > 0 ? `${entryFee} 꿀떡` : '무료'})`,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

    this.saveToDisk();

    // Broadcast room created event to participants
    this.chatGateway.emitChatRoomUpdated(participants, newRoom);

    return newRoom;
  }

  async createChatRoom(
    userId: string,
    dto: { title: string; category?: string; entryFee?: number; isGroup?: boolean; targetUserId?: string },
  ): Promise<ChatRoomItem> {
    const title = String(dto.title || '').trim();
    const fee = Math.max(0, Number(dto.entryFee || 0));

    // 호스트(개설자 본인) 정보 조회
    let hostName = '나';
    let hostAvatar: string | null = null;
    try {
      if (userId && userId !== 'guest') {
        const dbHost = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
        if (dbHost) {
          hostName = dbHost.nickname || dbHost.displayName || '나';
          hostAvatar = dbHost.avatarUrl || dbHost.photos?.[0]?.url || null;
        }
      }
    } catch {}

    // 관리자 채팅방 개설 온 소모 정책 적용
    try {
      const policyPath = path.join(this.dataDir, 'action-point-policy.json');
      if (fs.existsSync(policyPath)) {
        const policy = JSON.parse(fs.readFileSync(policyPath, 'utf-8'));
        const reqFee = policy?.chatRoomCreate?.enabled ? Number(policy.chatRoomCreate.amount) || 0 : 0;
        if (userId && reqFee > 0) {
          const dbUser = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pointBalance: true },
          });
          if (dbUser && (dbUser.pointBalance ?? 0) >= reqFee) {
            await this.prisma.user.update({
              where: { id: userId },
              data: { pointBalance: { decrement: reqFee } },
            });
          }
        }
      }
    } catch {}

    // 상대방(targetUserId)이 지정된 경우 2인 대화방으로 구성
    let counterpart: any = null;
    const participantIds = [userId];
    const targetUserId = dto.targetUserId ? String(dto.targetUserId).trim() : null;

    if (targetUserId && targetUserId !== userId) {
      participantIds.push(targetUserId);
      let targetName = '대화 상대';
      let targetAvatar: string | null = null;
      try {
        const u = await this.prisma.user.findUnique({
          where: { id: targetUserId },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
        if (u) {
          targetName = u.nickname || u.displayName || '대화 상대';
          targetAvatar = u.avatarUrl || u.photos?.[0]?.url || null;
        }
      } catch {}
      counterpart = {
        id: targetUserId,
        displayName: targetName,
        avatarUrl: targetAvatar,
        online: true,
      };
    }

    const isWaiting = !counterpart;

    // 1:1 대화방 생성
    const newRoom: ChatRoomItem = {
      id: `chat-room-${Date.now()}`,
      title,
      category: dto.category || '1:1',
      entryFee: fee,
      isGroup: false,
      participantIds,
      hostId: userId,
      creatorId: userId,
      host: {
        id: userId,
        displayName: hostName,
        avatarUrl: hostAvatar,
      },
      counterpart: counterpart || {
        id: '',
        displayName: '대화 상대 대기 중',
        avatarUrl: null,
        online: false,
      },
      isWaiting,
      lastMessage: isWaiting ? '대화 상대를 기다리는 중입니다 ⏳' : '대화방이 개설되었습니다.',
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.rooms.unshift(newRoom);
    this.messagesStore[newRoom.id] = [
      {
        id: `msg-init-${Date.now()}`,
        chatId: newRoom.id,
        senderAccountId: 'system',
        content: isWaiting
          ? `🎉 '${title}' 1:1 대화방이 생성되었습니다! 상대방이 입장하면 대화와 선물을 나눌 수 있습니다. (입장료: ${fee > 0 ? `${fee} ON` : '무료'})`
          : `🎉 '${title}' 1:1 대화방이 생성되었습니다! (입장료: ${fee > 0 ? `${fee} ON` : '무료'})`,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

    this.saveToDisk();
    return newRoom;
  }

  async getMessages(chatId: string, limit = 50): Promise<{ items: ChatMessageItem[]; pageInfo: { nextCursor: null } }> {
    const list = this.messagesStore[chatId] || [
      {
        id: `msg-empty-${chatId}`,
        chatId,
        senderAccountId: 'system',
        content: '대화를 시작해보세요!',
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

    // 카카오톡 규칙: 상대방이 답장한 이전의 모든 메시지는 상대방이 이미 읽은 상태(readAt 부여)
    const normalizedList = list.map((m, idx) => {
      if (!m.readAt && m.senderAccountId !== 'system') {
        const hasLaterReply = list.slice(idx + 1).some(
          (later) => later.senderAccountId !== m.senderAccountId && later.senderAccountId !== 'system'
        );
        if (hasLaterReply) {
          return { ...m, readAt: list[list.length - 1]?.createdAt || new Date().toISOString() };
        }
      }
      return m;
    });

    return {
      items: normalizedList,
      pageInfo: { nextCursor: null },
    };
  }

  async sendMessage(
    userId: string,
    dto: {
      chatId: string;
      content: string;
      clientMessageId?: string;
      type?: string;
      senderNickname?: string;
      senderName?: string;
      senderAvatar?: string;
      giftPoints?: number;
      giftName?: string;
      giftIcon?: string;
    },
  ): Promise<ChatMessageItem> {
    const { chatId, content, type = 'text', giftPoints, giftName, giftIcon } = dto;

    const isAdminAccount = (idOrName?: string) => {
      if (!idOrName) return false;
      const s = String(idOrName).trim().toLowerCase();
      return ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(s);
    };

    let effectiveUserId = userId;
    if (isAdminAccount(effectiveUserId)) {
      effectiveUserId = 'u-tester-02';
    }

    let senderName = dto.senderNickname || dto.senderName;
    let senderAvatar: string | undefined = dto.senderAvatar;
    if (!senderName && userId && userId !== 'guest' && !isAdminAccount(userId)) {
      try {
        const u = await this.prisma.user.findFirst({
          where: { OR: [{ id: userId }, { nickname: userId }] },
          select: { nickname: true, displayName: true, avatarUrl: true },
        });
        if (u) {
          senderName = u.nickname || u.displayName;
          if (!senderAvatar) senderAvatar = u.avatarUrl || undefined;
        }
      } catch {}
    }
    if (isAdminAccount(senderName) || !senderName) {
      senderName = isAdminAccount(userId) || isAdminAccount(senderName) ? '테스터02' : (userId === 'guest' ? '나' : userId);
    }

    // 🛡️ 운영자 제재(24시간 대화 제한 또는 영구 정지) 확인
    const nowTs = Date.now();
    const isSuspended =
      (this.suspendedUsers[effectiveUserId] && this.suspendedUsers[effectiveUserId] > nowTs) ||
      (senderName && this.suspendedUsers[senderName] && this.suspendedUsers[senderName] > nowTs);
    if (isSuspended) {
      throw new BadRequestException('운영 가이드라인 위반 조치로 인해 24시간 동안 1:1 대화 전송이 일시 정지되었습니다.');
    }
    const isBanned =
      this.bannedUsers.has(effectiveUserId) || (senderName && this.bannedUsers.has(senderName));
    if (isBanned) {
      throw new BadRequestException('운영 정책 위반(불법/사기/스팸)으로 인해 계정이 영구 정지되었습니다.');
    }

    // 🛡️ AI 안전 심사관 및 금칙어 정책 검사
    let processedContent = String(content || '');
    let isFlagged = false;
    let flagNotice: string | null = null;

    const keywordRule = this.policyRules.find((r) => r.id === 'rule-keyword');
    const contactRule = this.policyRules.find((r) => r.id === 'rule-contact-leak');
    const fraudRule = this.policyRules.find((r) => r.id === 'rule-fraud-money');

    // 1) 금칙어 및 욕설 자동 감지 & 실시간 마스킹
    if (keywordRule?.enabled && typeof processedContent === 'string') {
      for (const kw of this.bannedKeywords) {
        if (kw && processedContent.toLowerCase().includes(kw.toLowerCase())) {
          isFlagged = true;
          flagNotice = `[AI 심사관 감지] 금칙어("${kw}") 탐지됨`;
          const reg = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          processedContent = processedContent.replace(reg, '*'.repeat(kw.length));
        }
      }
    }

    // 2) 외부 연락처/전화번호 패턴 감지
    if (contactRule?.enabled && typeof processedContent === 'string') {
      const phoneRegex = /01[016789][-.\s]?\d{3,4}[-.\s]?\d{4}/g;
      if (phoneRegex.test(processedContent)) {
        isFlagged = true;
        flagNotice = '[AI 심사관 감지] 외부 연락처(전화번호) 유출 패턴 탐지';
        processedContent = processedContent.replace(phoneRegex, '***-****-****');
      }
    }

    // 3) 계좌번호 및 직거래 송금 유도 패턴 감지 (타사 벤치마킹: 당근마켓/번개장터 안전장치)
    if (fraudRule?.enabled && typeof processedContent === 'string') {
      // 10~16자리 연속 숫자 또는 하이픈 포함 계좌번호 패턴
      const accountRegex = /\b\d{3,6}[-\s]\d{2,6}[-\s]\d{3,8}\b|\b\d{11,16}\b/g;
      if (accountRegex.test(processedContent)) {
        isFlagged = true;
        flagNotice = '[AI 심사관 감지] 직거래 계좌번호 패턴 감지';
        processedContent = processedContent.replace(accountRegex, '***-***-******');
      }
    }

    // 4) 금전 요구 및 사기 의심 단어 감지
    if (fraudRule?.enabled && typeof processedContent === 'string') {
      const fraudKeywords = ['계좌', '입금', '송금', '비트코인', '코인', '대출', '조건만남', '스폰'];
      for (const fKw of fraudKeywords) {
        if (processedContent.includes(fKw)) {
          isFlagged = true;
          flagNotice = `[AI 심사관 감지] 금전/사기 의심 키워드("${fKw}") 감지`;
          break;
        }
      }
    }

    const isMediaContent =
      type === 'media' ||
      type === 'image' ||
      type === 'video' ||
      (typeof processedContent === 'string' &&
        (processedContent.includes('/media/files/') ||
          processedContent.startsWith('data:image/') ||
          /\.(jpeg|jpg|png|gif|webp|mp4|mov)(\?.*)?$/i.test(processedContent)));
    const resolvedType = type === 'gift' ? 'gift' : (isMediaContent ? 'image' : type);

    const now = new Date().toISOString();
    const msg: ChatMessageItem = {
      id: dto.clientMessageId || `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      chatId,
      senderAccountId: effectiveUserId,
      senderName,
      senderAvatar,
      content: processedContent,
      type: resolvedType,
      readAt: null,
      giftPoints: giftPoints !== undefined ? Number(giftPoints) : null,
      giftName: giftName || null,
      giftIcon: giftIcon || null,
      isFlagged,
      flagNotice,
      createdAt: now,
    };

    if (!this.messagesStore[chatId]) {
      this.messagesStore[chatId] = [];
    }

    // 답장을 보낸 경우, 이 방의 이전 상대방 메시지들은 내가 모두 읽은 것으로 처리 (readAt 소급 갱신)
    // 🛡️ 내가 보낸 메시지(effectiveUserId, userId, senderName)는 절대로 읽음 처리하지 않음!
    let readChanged = false;
    for (const prevMsg of this.messagesStore[chatId]) {
      const isMyPrev =
        prevMsg.senderAccountId === effectiveUserId ||
        prevMsg.senderAccountId === userId ||
        (senderName && prevMsg.senderName === senderName);
      if (!isMyPrev && !prevMsg.readAt && prevMsg.senderAccountId !== 'system') {
        prevMsg.readAt = now;
        readChanged = true;
      }
    }

    this.messagesStore[chatId].push(msg);

    const room = this.rooms.find((r) => r.id === chatId);
    let targetUserId: string | undefined;
    if (room) {
      room.lastMessage = isMediaContent ? '📷 사진' : processedContent;
      room.lastMessageAt = msg.createdAt;
      room.lastMessageAt = msg.createdAt;
      room.unreadCount = 0;
      if (isFlagged) {
        room.status = 'NEEDS_REVIEW';
        room.flaggedReason = flagNotice || '유해 키워드 또는 외부 연락처 유도 감지';
      }
      targetUserId = room.participantIds?.find((id) => id !== userId);
      if (!targetUserId && room.counterpart?.id && room.counterpart.id !== userId) {
        targetUserId = room.counterpart.id;
      }
      if (!targetUserId && room.hostId && room.hostId !== userId) {
        targetUserId = room.hostId;
      }
    }

    // 🚨 위반 플래그 감지 시 AI 직원 의사결정 큐 및 관리자 안전 리포트 자동 발행
    if (isFlagged) {
      const violatorKey = String(effectiveUserId || userId || senderName).trim();
      const currentViolationCount = (this.violationCounts[violatorKey] || 0) + 1;
      this.violationCounts[violatorKey] = currentViolationCount;

      this.logger.warn(`User [${violatorKey}] violation #${currentViolationCount} detected: ${flagNotice}`);

      const newReport: ChatSafetyReport = {
        id: `REP-${Date.now().toString().slice(-4)}`,
        roomId: chatId,
        roomTitle: room?.title || `${senderName} 1:1 대화`,
        reporterName: 'AI 안전 감시관 (Zev)',
        targetUserName: senderName,
        reason: `${flagNotice || '금칙어 및 안전 정책 위반 의심'} (${currentViolationCount}차)`,
        status: 'PENDING',
        createdAt: now,
      };
      this.safetyReports.unshift(newReport);

      // AI 직원 오케스트레이터 에스컬레이션 큐 비동기 등록
      try {
        if (this.orchestratorService?.escalateViolation) {
          this.orchestratorService.escalateViolation({
            domain: 'REPORT_SAFETY',
            targetId: chatId,
            targetUserId: userId !== 'guest' ? userId : undefined,
            riskScore: currentViolationCount >= 3 ? 95 : (currentViolationCount === 2 ? 80 : 60),
            violationTags: ['1:1 대화 정책 위반', flagNotice || '금칙어 감지', `${currentViolationCount}차 위반`],
            preliminaryRationale: `발신자 [${senderName}] 대화 내용에서 정책 위반 감지 (${currentViolationCount}회차 누적): "${content}"`,
          }).catch(() => {});
        }
      } catch (err) {
        this.logger.warn(`AI Orchestrator escalation failed: ${err}`);
      }

      // 🛡️ 타사(당근마켓/번개장터) 벤치마킹: 3진 아웃 점진적 자동 안전 장치
      if (currentViolationCount === 1) {
        // [1차 위반: 유도리 있는 안전 안내] 대화창 내에 시스템 안전 알림 메시지 자동 발행 (채팅 차단 X)
        const noticeMsg: ChatMessageItem = {
          id: `sys-notice-${Date.now()}`,
          chatId,
          senderAccountId: 'system',
          senderName: '시스템',
          content: '⚠️ [MOCCO 안전 알림] 외부 연락처(카톡, 번호) 유도나 계좌 직거래 요구는 사기 피해의 위험이 있습니다. 안전한 대화를 위해 서비스 내 기능을 이용해 주세요. (주의 1/3)',
          type: 'text',
          createdAt: new Date().toISOString(),
        };
        this.messagesStore[chatId].push(noticeMsg);
        setTimeout(() => {
          this.chatGateway.emitChatMessage(chatId, noticeMsg, undefined, room?.participantIds);
        }, 150);
      } else if (currentViolationCount === 2) {
        // [2차 위반: 강력 경고] 대화창 경고 안내 + 실시간 주의 팝업 알림 발송
        const warnMsg: ChatMessageItem = {
          id: `sys-warn-${Date.now()}`,
          chatId,
          senderAccountId: 'system',
          senderName: '시스템',
          content: '⚠️ [MOCCO 운영 경고] 비정상적인 연락처 또는 금융 정보 공유가 반복 감지되었습니다. 1회 추가 위반 시 1:1 대화 이용이 24시간 동안 제한됩니다. (경고 2/3)',
          type: 'text',
          createdAt: new Date().toISOString(),
        };
        this.messagesStore[chatId].push(warnMsg);
        setTimeout(() => {
          this.chatGateway.emitChatMessage(chatId, warnMsg, undefined, room?.participantIds);
          this.chatGateway.emitAdminWarning(chatId, warnMsg, effectiveUserId || senderName);
        }, 150);
      } else if (currentViolationCount >= 3) {
        // [3차 이상 위반: 24시간 대화 제한 자동 집행 및 강제 퇴장]
        const suspendMsg: ChatMessageItem = {
          id: `sys-suspend-${Date.now()}`,
          chatId,
          senderAccountId: 'system',
          senderName: '시스템',
          content: `🚫 [제재 적용] 1:1 대화 안전 가이드라인 3회 위반으로 인해 ${senderName} 회원의 대화 권한이 24시간 동안 정지되었습니다.`,
          type: 'text',
          createdAt: new Date().toISOString(),
        };
        this.messagesStore[chatId].push(suspendMsg);
        this.suspendedUsers[violatorKey] = Date.now() + 24 * 3600 * 1000;
        if (room) {
          room.status = 'ARCHIVED';
          room.flaggedReason = '안전 정책 3회 반복 위반으로 24시간 대화 제한 자동 집행';
        }
        setTimeout(() => {
          this.chatGateway.emitChatMessage(chatId, suspendMsg, undefined, room?.participantIds);
          this.chatGateway.emitAdminSanction(
            chatId,
            'SUSPEND_24H',
            suspendMsg,
            effectiveUserId || senderName,
            room?.participantIds,
          );
        }, 150);
      }
    }

    this.saveToDisk();

    // 내가 답장을 보냄으로써 상대방의 이전 메시지가 모두 읽혔음을 상대방에게 실시간 전파! (1 숫자 즉시 제거)
    if (readChanged) {
      this.chatGateway.emitChatRead(chatId, userId, room?.participantIds);
    }

    // Broadcast message to room and notify target user
    this.chatGateway.emitChatMessage(chatId, msg, targetUserId, room?.participantIds);

    if (room && room.participantIds) {
      this.chatGateway.emitChatRoomUpdated(room.participantIds, room);
    }

    return msg;
  }

  /**
   * 1:1 대화방 나가기/삭제 처리
   * - 참여자 한쪽이라도 나가기를 하면 사용자 앱/웹 목록에서는 완전히 제거
   * - 대한민국 법규 준수를 위해 본사 관리자 아카이브(통비법 3개월, 전자상거래법 3년)로 자동 격리 보관
   */
  async deleteChat(userId: string, chatId: string): Promise<{ ok: boolean }> {
    const idx = this.rooms.findIndex((r) => r.id === chatId);
    const room = idx !== -1 ? this.rooms[idx] : null;

    if (room) {
      const msgs = this.messagesStore[chatId] || [];
      const hasTransactions = Boolean(
        room.entryFee > 0 || msgs.some((m) => m.type === 'gift' || (m.giftPoints && m.giftPoints > 0)),
      );

      // 대한민국 법정 보존 기한 산출
      // 1) 전자상거래 등에서의 소비자보호에 관한 법률 제6조: 결제/선물 분쟁 보존 3년 (1,095일)
      // 2) 통신비밀보호법 제15조의2: 인터넷 접속 및 통신 로그 최소 3개월 (90일) 보존
      const now = new Date();
      const retentionDays = hasTransactions ? 365 * 3 : 90;
      const retentionUntil = new Date(now.getTime() + retentionDays * 24 * 3600 * 1000).toISOString();
      const retentionBasis = hasTransactions
        ? '전자상거래 등에서의 소비자보호에 관한 법률 제6조 (선물/결제 분쟁 기록 3년 보존)'
        : '통신비밀보호법 제15조의2 (로그기록 3개월 보존)';

      const archivedRoom: ChatRoomItem = {
        ...room,
        status: 'ARCHIVED',
        deletedAt: now.toISOString(),
        retentionUntil,
        retentionBasis,
        lastMessage: '[종료된 대화] 사용자가 퇴장하여 대화방이 종료되었습니다.',
      };

      this.archivedRooms.unshift(archivedRoom);
      this.rooms.splice(idx, 1);

      // 실시간 웹소켓으로 상대방 및 참여자에게 대화방 종료 이벤트 즉시 브로드캐스트
      try {
        this.chatGateway.emitChatRoomDeleted(room.participantIds || [userId], chatId);
      } catch {}

      this.saveToDisk();
      this.logger.log(`Chat room [${chatId}] archived for legal compliance until ${retentionUntil} (${retentionBasis})`);
    }

    return { ok: true };
  }

  getAllRoomsForAdmin(): any[] {
    const isAdminAccount = (idOrName?: string) => {
      if (!idOrName) return false;
      const s = String(idOrName).trim().toLowerCase();
      return ['super admin', 'admin', 'admin_super_user', '관리자', '슈퍼어드민'].includes(s);
    };

    const mapToAdmin = (room: ChatRoomItem, isArchived: boolean) => {
      const msgs = this.messagesStore[room.id] || [];
      const hasFlaggedMsg = msgs.some((m) => m.isFlagged);
      const computedStatus = isArchived
        ? 'CLOSED'
        : room.status === 'NEEDS_REVIEW' || hasFlaggedMsg
        ? 'NEEDS_REVIEW'
        : room.status === 'FLAGGED'
        ? 'FLAGGED'
        : 'ACTIVE';

      const rawHost = room.host?.displayName || '호스트';
      const displayHost = isAdminAccount(rawHost) || isAdminAccount(room.host?.id) ? '테스터02' : rawHost;

      const rawCounterpart = room.counterpart?.displayName || room.title;
      const displayCounterpart = isAdminAccount(rawCounterpart) || isAdminAccount(room.counterpart?.id) ? '테스터02' : rawCounterpart;

      let cleanTitle = room.title;
      if (isAdminAccount(cleanTitle)) {
        cleanTitle = displayCounterpart;
      }

      return {
        id: room.id,
        title: cleanTitle,
        category: room.category,
        region: '서울 강남구',
        distanceKm: 1.5,
        unread: room.unreadCount,
        newMessages: msgs.length,
        participants: room.participantIds?.length || 2,
        status: computedStatus,
        createdAt: room.createdAt,
        lastMessageAt: room.lastMessageAt,
        lastMessage: room.lastMessage,
        flaggedReason: room.flaggedReason || (hasFlaggedMsg ? 'AI 유해/금칙어 감지됨' : undefined),
        isArchived,
        deletedAt: room.deletedAt || null,
        retentionUntil: room.retentionUntil || null,
        retentionBasis: room.retentionBasis || null,
        userA: {
          id: room.participantIds?.[0] || 'user-1',
          nickname: displayHost,
          age: 26,
          gender: '남',
          region: '서울 강남구',
          avatar: room.host?.avatarUrl || null,
        },
        userB: {
          id: room.counterpart?.id || room.participantIds?.[1] || 'user-2',
          nickname: displayCounterpart,
          age: 28,
          gender: '여',
          region: '서울시',
          avatar: room.counterpart?.avatarUrl || null,
        },
        messages: msgs.map((m) => {
          let sName = m.senderName || (m.senderAccountId === 'system' ? '시스템' : '참여자');
          if (isAdminAccount(sName) || isAdminAccount(m.senderAccountId)) {
            sName = '테스터02';
          }
          let cleanContent = m.content;
          if (typeof cleanContent === 'string' && cleanContent.includes('admin_super_user')) {
            cleanContent = cleanContent.replace(/admin_super_user/g, '테스터02');
          }
          const isMediaMsg =
            m.type === 'image' ||
            m.type === 'media' ||
            (typeof cleanContent === 'string' &&
              (cleanContent.includes('/media/files/') ||
                cleanContent.startsWith('data:image/') ||
                /\.(jpeg|jpg|png|gif|webp|mp4|mov)(\?.*)?$/i.test(cleanContent)));
          const resolvedAdminType = m.type === 'gift' ? 'GIFT' : (isMediaMsg ? 'IMAGE' : 'TEXT');
          return {
            id: m.id,
            senderId: isAdminAccount(m.senderAccountId) ? 'u-tester-02' : m.senderAccountId,
            senderName: sName,
            text: cleanContent,
            time: m.createdAt,
            type: resolvedAdminType,
            giftName: m.giftName,
            isFlagged: Boolean(m.isFlagged),
            flagNotice: m.flagNotice || undefined,
          };
        }),
      };
    };

    const activeList = this.rooms.map((r) => mapToAdmin(r, false));
    const archivedList = this.archivedRooms.map((r) => mapToAdmin(r, true));
    return [...activeList, ...archivedList];
  }

  // =========================================================================
  // 🛡️ 1:1 대화 관리 및 AI 안전 정책 컨트롤 패널 API
  // =========================================================================
  async getChatSafetySnapshot() {
    const allRooms = this.getAllRoomsForAdmin();
    const activeCount = this.rooms.length;
    const archivedCount = this.archivedRooms.length;
    const flaggedCount = allRooms.filter((r) => r.status === 'NEEDS_REVIEW' || r.status === 'FLAGGED').length;

    return {
      ok: true,
      rooms: allRooms,
      reports: this.safetyReports,
      policyRules: this.policyRules,
      bannedKeywords: this.bannedKeywords,
      safetyMemo: this.safetyMemo,
      meta: {
        activeCount,
        archivedCount,
        flaggedCount,
        legalNotice: '「통신비밀보호법」 제15조의2 (로그기록 최소 3개월 보존) 및 「전자상거래법」 제6조 (분쟁처리 및 결제/선물 3~5년 보존) 준수',
        legalRetentionStats: {
          electronicCommerceLawCount: this.archivedRooms.filter((r) => (r.retentionBasis || '').includes('전자상거래')).length,
          telecomSecretProtectionLawCount: this.archivedRooms.filter((r) => (r.retentionBasis || '').includes('통신비밀보호법')).length,
        },
      },
    };
  }

  async updateChatPolicyRule(ruleId: string, payload: { enabled?: boolean; autoAction?: string }) {
    const rule = this.policyRules.find((r) => r.id === ruleId);
    if (!rule) {
      throw new NotFoundException(`정책 규칙 [${ruleId}]을 찾을 수 없습니다.`);
    }
    if (typeof payload.enabled === 'boolean') {
      rule.enabled = payload.enabled;
    }
    if (typeof payload.autoAction === 'string' && payload.autoAction) {
      rule.autoAction = payload.autoAction;
    }
    this.saveToDisk();
    return rule;
  }

  async saveChatSafetyMemo(memo: string) {
    this.safetyMemo = memo;
    this.saveToDisk();
    return { ok: true, memo: this.safetyMemo };
  }

  async updateBannedKeywords(keywords: string[]) {
    if (Array.isArray(keywords)) {
      this.bannedKeywords = Array.from(new Set(keywords.map((k) => String(k).trim()).filter(Boolean)));
      this.saveToDisk();
    }
    return { ok: true, bannedKeywords: this.bannedKeywords };
  }

  async resolveChatReport(reportId: string, payload: { action?: string; reason?: string; note?: string }) {
    let report = this.safetyReports.find((r) => r.id === reportId);
    if (!report) {
      report = {
        id: reportId,
        roomId: 'unknown',
        roomTitle: '1:1 대화',
        reporterName: 'AI 심사관',
        targetUserName: '피신고자',
        reason: payload.reason || payload.action || '이상 대화 감지',
        status: payload.action === 'DISMISS' || payload.action === 'DISMISSED_NORMAL' ? 'DISMISSED' : 'RESOLVED',
        createdAt: new Date().toISOString(),
      };
      this.safetyReports.unshift(report);
    } else {
      report.status = payload.action === 'DISMISS' || payload.action === 'DISMISSED_NORMAL' ? 'DISMISSED' : 'RESOLVED';
      report.resolvedAt = new Date().toISOString();
      report.actionTaken = payload.note || payload.reason || payload.action || '조치 완료';
    }
    this.saveToDisk();
    return report;
  }

  async updateRoomByAdmin(
    roomId: string,
    payload: {
      status?: 'ACTIVE' | 'CLOSED' | 'FLAGGED' | 'NEEDS_REVIEW' | 'ARCHIVED';
      memo?: string;
      actionType?: 'WARN' | 'SUSPEND_24H' | 'BAN_PERMANENT' | 'DISMISS_NORMAL';
      cannedMessage?: string;
      targetNickname?: string;
      targetUserId?: string;
      allowEntry?: boolean;
    },
  ) {
    let room = this.rooms.find((r) => r.id === roomId);
    let isArchived = false;
    if (!room) {
      room = this.archivedRooms.find((r) => r.id === roomId);
      if (room) isArchived = true;
    }
    if (!room) {
      throw new NotFoundException(`대화방 [${roomId}]을 찾을 수 없습니다.`);
    }

    if (!this.messagesStore[roomId]) {
      this.messagesStore[roomId] = [];
    }

    const targetNick = payload.targetNickname || room.counterpart?.displayName || room.title || '회원';
    const targetId = payload.targetUserId || room.counterpart?.id;

    // 1) ⚠️ 주의 경고장 발송
    if (payload.actionType === 'WARN' || (payload.cannedMessage && payload.status === 'ACTIVE')) {
      room.status = 'ACTIVE';
      delete room.flaggedReason;
      const warnMsg: ChatMessageItem = {
        id: `sys-warn-${Date.now()}`,
        chatId: roomId,
        senderAccountId: 'system',
        senderName: '시스템',
        content:
          payload.cannedMessage ||
          `⚠️ [관리자 경고 발송] ${targetNick} 회원님에게 1:1 대화 및 수다방 안전 가이드라인 준수 주의 조치가 전달되었습니다.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      };
      this.messagesStore[roomId].push(warnMsg);
      room.lastMessage = warnMsg.content;
      room.lastMessageAt = warnMsg.createdAt;

      try {
        this.chatGateway.emitAdminWarning(roomId, warnMsg, targetId || targetNick);
      } catch (e: any) {
        this.logger.warn(`emitAdminWarning error: ${e?.message}`);
      }
    }
    // 2) 👤 24시간 1:1 대화 정지
    else if (
      payload.actionType === 'SUSPEND_24H' ||
      (payload.status === 'ARCHIVED' && payload.cannedMessage?.includes('24시간'))
    ) {
      room.status = 'ARCHIVED';
      room.flaggedReason = '24시간 1:1 대화 정지 조치 완료';
      const suspendMsg: ChatMessageItem = {
        id: `sys-suspend-${Date.now()}`,
        chatId: roomId,
        senderAccountId: 'system',
        senderName: '시스템',
        content:
          payload.cannedMessage ||
          `🚫 [제재 적용] ${targetNick} 회원의 1:1 대화 전송 권한이 24시간 동안 차단되었습니다.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      };
      this.messagesStore[roomId].push(suspendMsg);
      room.lastMessage = suspendMsg.content;
      room.lastMessageAt = suspendMsg.createdAt;

      const expiry = Date.now() + 24 * 3600 * 1000;
      if (targetId) this.suspendedUsers[targetId] = expiry;
      if (targetNick) this.suspendedUsers[targetNick] = expiry;

      const idx = this.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const removed = this.rooms.splice(idx, 1)[0];
        removed.status = 'ARCHIVED';
        removed.deletedAt = new Date().toISOString();
        removed.retentionUntil = new Date(Date.now() + 365 * 3 * 24 * 3600 * 1000).toISOString();
        removed.retentionBasis = '관리자 24시간 제재 조치 및 법정 분쟁 보존';
        this.archivedRooms.unshift(removed);
        isArchived = true;
      }

      try {
        this.chatGateway.emitAdminSanction(
          roomId,
          'SUSPEND_24H',
          suspendMsg,
          targetId || targetNick,
          room.participantIds,
        );
      } catch (e: any) {
        this.logger.warn(`emitAdminSanction error: ${e?.message}`);
      }
    }
    // 3) 🚫 계정 영구 정지
    else if (payload.actionType === 'BAN_PERMANENT' || payload.cannedMessage?.includes('영구 정지')) {
      room.status = 'ARCHIVED';
      room.flaggedReason = '불법 사기/유도 행위로 영구 정지됨';
      const banMsg: ChatMessageItem = {
        id: `sys-ban-${Date.now()}`,
        chatId: roomId,
        senderAccountId: 'system',
        senderName: '시스템',
        content:
          payload.cannedMessage ||
          `⛔ [영구 정지] ${targetNick} 계정이 영구 정지되어 모든 서비스 이용이 차단되었습니다.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      };
      this.messagesStore[roomId].push(banMsg);
      room.lastMessage = banMsg.content;
      room.lastMessageAt = banMsg.createdAt;

      if (targetId) this.bannedUsers.add(targetId);
      if (targetNick) this.bannedUsers.add(targetNick);

      const idx = this.rooms.findIndex((r) => r.id === roomId);
      if (idx !== -1) {
        const removed = this.rooms.splice(idx, 1)[0];
        removed.status = 'ARCHIVED';
        removed.deletedAt = new Date().toISOString();
        removed.retentionUntil = new Date(Date.now() + 365 * 3 * 24 * 3600 * 1000).toISOString();
        removed.retentionBasis = '관리자 영구 제재 조치 및 법정 분쟁 보존';
        this.archivedRooms.unshift(removed);
        isArchived = true;
      }

      try {
        this.chatGateway.emitAdminSanction(
          roomId,
          'BAN_PERMANENT',
          banMsg,
          targetId || targetNick,
          room.participantIds,
        );
      } catch (e: any) {
        this.logger.warn(`emitAdminSanction error: ${e?.message}`);
      }
    }
    // 4) 🟢 정상 대화 종결 (무혐의)
    else if (
      payload.actionType === 'DISMISS_NORMAL' ||
      (payload.status === 'ACTIVE' && !payload.cannedMessage)
    ) {
      room.status = 'ACTIVE';
      delete room.flaggedReason;
      const dismissMsg: ChatMessageItem = {
        id: `sys-dismiss-${Date.now()}`,
        chatId: roomId,
        senderAccountId: 'system',
        senderName: '시스템',
        content: `🟢 [안전 확인] 관리자 검토 결과 해당 대화방의 이상 징후가 해제되어 정상 대화로 확인되었습니다.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      };
      this.messagesStore[roomId].push(dismissMsg);
      room.lastMessage = dismissMsg.content;
      room.lastMessageAt = dismissMsg.createdAt;

      try {
        this.chatGateway.emitChatMessage(roomId, dismissMsg, undefined, room.participantIds);
      } catch (e: any) {
        this.logger.warn(`emitChatMessage error: ${e?.message}`);
      }
    }
    // 일반 상태 업데이트
    else if (payload.status) {
      room.status = payload.status;
      if (payload.status === 'CLOSED') {
        const idx = this.rooms.findIndex((r) => r.id === roomId);
        if (idx !== -1) {
          const removed = this.rooms.splice(idx, 1)[0];
          removed.status = 'ARCHIVED';
          removed.deletedAt = new Date().toISOString();
          removed.retentionUntil = new Date(Date.now() + 365 * 3 * 24 * 3600 * 1000).toISOString();
          removed.retentionBasis = '관리자 강제 조치 및 전자상거래/통비법 분쟁 보존';
          this.archivedRooms.unshift(removed);
          isArchived = true;
          try {
            this.chatGateway.emitChatRoomDeleted(removed.participantIds, roomId);
          } catch {}
        }
      }
    }

    this.saveToDisk();

    const allAdminRooms = this.getAllRoomsForAdmin();
    const adminRoom = allAdminRooms.find((r) => r.id === roomId);
    return adminRoom || room;
  }

  async deductPoints(userId: string, points: number): Promise<number | null> {
    if (!userId || userId === 'guest' || points <= 0) return null;
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pointBalance: true },
      });
      if (dbUser) {
        const newBal = Math.max(0, (dbUser.pointBalance ?? 0) - points);
        await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: newBal },
        });
        return newBal;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to deduct points for ${userId}: ${e?.message}`);
    }
    return null;
  }

  async addPoints(userId: string, points: number): Promise<number | null> {
    if (!userId || userId === 'guest' || points <= 0) return null;
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { pointBalance: true },
      });
      if (dbUser) {
        const newBal = (dbUser.pointBalance ?? 0) + points;
        await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: newBal },
        });
        return newBal;
      }
    } catch (e: any) {
      this.logger.warn(`Failed to add points for ${userId}: ${e?.message}`);
    }
    return null;
  }

  // =========================================================================
  // 1. 오픈 추천 대화방 (Open Waiting Rooms) API
  // =========================================================================
  async getOpenRooms(userId?: string): Promise<any[]> {
    const list = [...this.openRooms].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return list.map((item) => ({
      ...item,
      host: {
        id: item.hostId,
        name: item.hostName,
        displayName: item.hostName,
        avatar: item.hostAvatar,
        avatarUrl: item.hostAvatar,
        age: item.hostAge || 26,
        location: item.hostRegion || '서울 강남구',
        region: item.hostRegion || '서울 강남구',
        gender: item.hostGender || '여',
        headline: `${item.title} (${item.category})`,
        bio: `${item.hostName}님의 추천 1:1 대화방입니다. 부담 없이 입장해 대화를 나눠보세요 ✨`,
        isOnline: true,
      },
    }));
  }

  async createOpenRoom(
    userId: string,
    dto: { title: string; category?: string; entryFee?: number },
  ): Promise<OpenChatRoomItem> {
    const title = String(dto.title || '').trim();
    const fee = Math.max(0, Number(dto.entryFee || 0));

    let hostName = '나';
    let hostAvatar: string | null = null;
    let hostAge = 26;
    let hostRegion = '서울 강남구';
    let hostGender = '여';

    try {
      if (userId && userId !== 'guest') {
        const u = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
        if (u) {
          const userAny = u as any;
          hostName = u.nickname || u.displayName || '나';
          hostAvatar = u.avatarUrl || u.photos?.[0]?.url || null;
          hostAge = userAny.birthYear ? new Date().getFullYear() - userAny.birthYear + 1 : 26;
          hostRegion = userAny.region || '서울 강남구';
          hostGender = userAny.gender === 'MALE' ? '남' : '여';
        }
      }
    } catch {}

    const openRoom: OpenChatRoomItem = {
      id: `open-room-${Date.now()}`,
      title,
      category: dto.category || '친목',
      entryFee: fee,
      hostId: userId,
      hostName,
      hostAvatar,
      hostAge,
      hostRegion,
      hostGender,
      createdAt: new Date().toISOString(),
      matchedCount: 0,
    };

    this.openRooms.unshift(openRoom);

    // 개설자 본인의 대화 목록에도 대기방으로 등록
    await this.createChatRoom(userId, {
      title,
      category: dto.category,
      entryFee: fee,
      isGroup: false,
    });

    this.saveToDisk();
    return openRoom;
  }

  async joinOpenRoom(
    guestUserId: string,
    openRoomId: string,
  ): Promise<{ ok: boolean; room: ChatRoomItem; chatRoom?: ChatRoomItem; data?: ChatRoomItem; hostName: string; entryFee: number }> {
    const openRoom = this.openRooms.find((r) => r.id === openRoomId);
    if (!openRoom) {
      throw new NotFoundException('해당 추천 대화방을 찾을 수 없습니다.');
    }

    if (openRoom.hostId === guestUserId && guestUserId !== 'guest') {
      throw new Error('본인이 개설한 대화방에는 입장 신청을 할 수 없습니다.');
    }

    const fee = openRoom.entryFee || 0;

    // 게스트 포인트 차감
    if (fee > 0 && guestUserId && guestUserId !== 'guest') {
      const bal = await this.deductPoints(guestUserId, fee);
      if (bal === null) {
        throw new Error(`입장에 필요한 ${fee} ON 포인트가 부족합니다.`);
      }
    }

    // 방장(호스트)에게 입장료 포인트 즉시 적립!
    if (fee > 0 && openRoom.hostId && openRoom.hostId !== 'guest') {
      await this.addPoints(openRoom.hostId, fee);
    }

    // 게스트 유저 정보 조회
    let guestName = '게스트';
    let guestAvatar: string | null = null;
    try {
      if (guestUserId && guestUserId !== 'guest') {
        const u = await this.prisma.user.findUnique({
          where: { id: guestUserId },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
        if (u) {
          guestName = u.nickname || u.displayName || '게스트';
          guestAvatar = u.avatarUrl || u.photos?.[0]?.url || null;
        }
      }
    } catch {}

    // 호스트와 게스트 간의 새로운 1:1 대화방 즉시 생성
    const newChatId = `chat-matched-${Date.now()}`;
    const newRoom: ChatRoomItem = {
      id: newChatId,
      title: `${openRoom.hostName} & ${guestName}`,
      category: openRoom.category,
      entryFee: fee,
      isGroup: false,
      participantIds: [openRoom.hostId, guestUserId],
      hostId: openRoom.hostId,
      creatorId: openRoom.hostId,
      host: {
        id: openRoom.hostId,
        displayName: openRoom.hostName,
        avatarUrl: openRoom.hostAvatar,
      },
      counterpart: {
        id: guestUserId,
        displayName: guestName,
        avatarUrl: guestAvatar,
        online: true,
      },
      isWaiting: false,
      lastMessage: `${guestName}님이 대화방에 입장했습니다.`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 1,
      createdAt: new Date().toISOString(),
    };

    const welcomeMsg: ChatMessageItem = {
      id: `msg-welcome-${newChatId}`,
      chatId: newChatId,
      senderAccountId: guestUserId,
      senderName: guestName,
      senderAvatar: guestAvatar || undefined,
      content: `🎉 '${openRoom.title}' 대화방이 매칭되었습니다! (${guestName}님이 입장료 ${fee > 0 ? `${fee} ON을 지불하고` : '무료로'} 입장)`,
      type: 'text',
      readAt: null,
      createdAt: new Date().toISOString(),
    };

    this.rooms.unshift(newRoom);
    this.messagesStore[newChatId] = [welcomeMsg];

    openRoom.matchedCount = (openRoom.matchedCount || 0) + 1;
    this.saveToDisk();

    // 호스트에게 대화방 개설 실시간 전파 및 알림 트리거 ("모꼬" 사운드)
    try {
      this.chatGateway.emitChatMessage(newChatId, welcomeMsg, openRoom.hostId);
      this.chatGateway.emitChatRoomUpdated([openRoom.hostId, guestUserId], newRoom);
    } catch {}

    return {
      ok: true,
      room: newRoom,
      chatRoom: newRoom,
      data: newRoom,
      hostName: openRoom.hostName,
      entryFee: fee,
    };
  }

  // =========================================================================
  // 2. 1:1 대화 신청/수락/거절 시스템 (Chat Requests) API
  // =========================================================================
  async getReceivedRequests(userId: string): Promise<any[]> {
    const list = this.chatRequests
      .filter(
        (r) => r.receiverId === userId || userId === 'guest' || userId === 'dummy-user' || userId === 'user-me',
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return list.map((req) => ({
      ...req,
      sender: {
        id: req.senderId,
        name: req.senderName,
        displayName: req.senderName,
        avatar: req.senderAvatar,
        avatarUrl: req.senderAvatar,
        age: req.senderAge || 26,
        location: req.senderRegion || '서울 강남구',
        region: req.senderRegion || '서울 강남구',
        headline: req.message,
        bio: `안녕하세요! ${req.senderName}입니다. 편하게 대화 나누고 싶어요 ✨`,
        isOnline: true,
      },
    }));
  }

  async sendChatRequest(
    senderId: string,
    dto: { targetUserId: string; message?: string; entryFee?: number },
  ): Promise<ChatRequestItem> {
    const targetUserId = String(dto.targetUserId || '').trim();
    if (!targetUserId || targetUserId === senderId) {
      throw new Error('대화 신청 상대방 정보가 올바르지 않습니다.');
    }

    const fee = Math.max(0, Number(dto.entryFee || 0));

    // 발신자 포인트 가차감
    if (fee > 0 && senderId && senderId !== 'guest') {
      const bal = await this.deductPoints(senderId, fee);
      if (bal === null) {
        throw new Error(`대화 신청에 필요한 ${fee} ON 포인트가 부족합니다.`);
      }
    }

    let senderName = '새로운 인연';
    let senderAvatar: string | null = null;
    let senderAge = 26;
    let senderRegion = '서울 강남구';

    try {
      if (senderId && senderId !== 'guest') {
        const u = await this.prisma.user.findUnique({
          where: { id: senderId },
          include: { photos: { take: 1, orderBy: { sortOrder: 'asc' } } },
        });
        if (u) {
          const userAny = u as any;
          senderName = u.nickname || u.displayName || '새로운 인연';
          senderAvatar = u.avatarUrl || u.photos?.[0]?.url || null;
          senderAge = userAny.birthYear ? new Date().getFullYear() - userAny.birthYear + 1 : 26;
          senderRegion = userAny.region || '서울 강남구';
        }
      }
    } catch {}

    const reqItem: ChatRequestItem = {
      id: `req-${Date.now()}`,
      senderId,
      senderName,
      senderAvatar,
      senderAge,
      senderRegion,
      receiverId: targetUserId,
      message: dto.message || '안녕하세요! 프로필 보고 대화 신청드립니다 ✨',
      entryFee: fee,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    this.chatRequests.unshift(reqItem);
    this.saveToDisk();
    return reqItem;
  }

  async acceptChatRequest(
    userId: string,
    requestId: string,
  ): Promise<{ ok: boolean; room: ChatRoomItem; chatRoom?: ChatRoomItem; data?: ChatRoomItem; request: ChatRequestItem }> {
    const req = this.chatRequests.find((r) => r.id === requestId);
    if (!req) {
      throw new NotFoundException('해당 대화 신청을 찾을 수 없습니다.');
    }

    if (req.status !== 'PENDING') {
      throw new Error('이미 처리된 대화 신청입니다.');
    }

    req.status = 'ACCEPTED';

    // 수락자(나)에게 신청자가 지불한 입장료 포인트 적립!
    if (req.entryFee > 0 && userId && userId !== 'guest') {
      await this.addPoints(userId, req.entryFee);
    }

    // 두 유저 간 1:1 대화방 개설
    const newRoom = await this.ensureDirectRoom(userId, req.senderId);

    // 수락 축하 시스템 메시지 등록
    this.messagesStore[newRoom.id] = this.messagesStore[newRoom.id] || [];
    this.messagesStore[newRoom.id].push({
      id: `msg-acc-${Date.now()}`,
      chatId: newRoom.id,
      senderAccountId: 'system',
      content: `🎉 1:1 대화 신청이 수락되었습니다! (입장료 ${req.entryFee > 0 ? `${req.entryFee} ON 적립` : '무료'}) 즐겁게 대화해 보세요!`,
      type: 'text',
      createdAt: new Date().toISOString(),
    });

    req.chatRoomId = newRoom.id;
    this.saveToDisk();

    return {
      ok: true,
      room: newRoom,
      chatRoom: newRoom,
      data: newRoom,
      request: req,
    };
  }

  async rejectChatRequest(
    userId: string,
    requestId: string,
  ): Promise<{ ok: boolean; request: ChatRequestItem }> {
    const req = this.chatRequests.find((r) => r.id === requestId);
    if (!req) {
      throw new NotFoundException('해당 대화 신청을 찾을 수 없습니다.');
    }

    if (req.status !== 'PENDING') {
      throw new Error('이미 처리된 대화 신청입니다.');
    }

    req.status = 'REJECTED';

    // 거절 시 발신자에게 입장료 포인트 전액 환불!
    if (req.entryFee > 0 && req.senderId && req.senderId !== 'guest') {
      await this.addPoints(req.senderId, req.entryFee);
    }

    this.saveToDisk();
    return {
      ok: true,
      request: req,
    };
  }
}

