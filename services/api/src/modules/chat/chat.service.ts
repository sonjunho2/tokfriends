import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
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
  giftPoints?: number | null;
  giftName?: string | null;
  giftIcon?: string | null;
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
  private readonly messagesFilePath = path.join(this.dataDir, 'chat-messages.json');
  private readonly openRoomsFilePath = path.join(this.dataDir, 'open-rooms.json');
  private readonly chatRequestsFilePath = path.join(this.dataDir, 'chat-requests.json');

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
        content: '안녕하세요! 다가온에서 프로필 보고 인사드려요 👋',
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

  constructor(private readonly prisma: PrismaService) {}

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
      fs.writeFileSync(this.messagesFilePath, JSON.stringify(this.messagesStore, null, 2), 'utf-8');
      fs.writeFileSync(this.openRoomsFilePath, JSON.stringify(this.openRooms, null, 2), 'utf-8');
      fs.writeFileSync(this.chatRequestsFilePath, JSON.stringify(this.chatRequests, null, 2), 'utf-8');
    } catch (e: any) {
      this.logger.warn(`Failed to save chat data to disk: ${e?.message}`);
    }
  }

  async getChats(userId?: string): Promise<ChatRoomItem[]> {
    return this.rooms.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
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

  async ensureDirectRoom(userId: string, targetUserId: string): Promise<ChatRoomItem> {
    const existing = this.rooms.find(
      (r) =>
        !r.isGroup &&
        (r.counterpart?.id === targetUserId ||
          (r.participantIds.includes(userId) && r.participantIds.includes(targetUserId))),
    );

    if (existing) {
      return existing;
    }

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

    const newRoom: ChatRoomItem = {
      id: `chat-direct-${Date.now()}`,
      title: targetName,
      category: '1:1',
      entryFee: 0,
      isGroup: false,
      participantIds: [userId, targetUserId],
      counterpart: {
        id: targetUserId,
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
        content: `🎉 ${targetName}님과의 1:1 대화방이 열렸습니다.`,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

    this.saveToDisk();
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
    return {
      items: list,
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
      giftPoints?: number;
      giftName?: string;
      giftIcon?: string;
    },
  ): Promise<ChatMessageItem> {
    const { chatId, content, type = 'text', giftPoints, giftName, giftIcon } = dto;
    const msg: ChatMessageItem = {
      id: dto.clientMessageId || `msg-${Date.now()}`,
      chatId,
      senderAccountId: userId,
      senderName: userId === 'guest' ? '나' : undefined,
      content,
      type,
      giftPoints: giftPoints !== undefined ? Number(giftPoints) : null,
      giftName: giftName || null,
      giftIcon: giftIcon || null,
      createdAt: new Date().toISOString(),
    };

    if (!this.messagesStore[chatId]) {
      this.messagesStore[chatId] = [];
    }
    this.messagesStore[chatId].push(msg);

    const room = this.rooms.find((r) => r.id === chatId);
    if (room) {
      room.lastMessage = content;
      room.lastMessageAt = msg.createdAt;
    }

    this.saveToDisk();
    return msg;
  }

  async deleteChat(userId: string, chatId: string): Promise<{ ok: boolean }> {
    // 1:1 대화방이므로 어느 한쪽이라도 삭제하면 방을 완전히 삭제하여 양쪽 모두에서 사라짐
    const idx = this.rooms.findIndex((r) => r.id === chatId);
    if (idx !== -1) {
      this.rooms.splice(idx, 1);
    }
    delete this.messagesStore[chatId];
    this.saveToDisk();
    return { ok: true };
  }

  getAllRoomsForAdmin(): any[] {
    return this.rooms.map((room) => ({
      id: room.id,
      title: room.title,
      category: room.category,
      region: '서울 강남구',
      distanceKm: 1.5,
      unread: room.unreadCount,
      newMessages: (this.messagesStore[room.id] || []).length,
      participants: 2,
      status: 'ACTIVE',
      createdAt: room.createdAt,
      lastMessageAt: room.lastMessageAt,
      lastMessage: room.lastMessage,
      userA: {
        id: room.participantIds[0] || 'user-1',
        nickname: '나',
        age: 26,
        gender: '남',
        region: '서울 강남구',
        avatar: null,
      },
      userB: {
        id: room.counterpart?.id || 'user-2',
        nickname: room.counterpart?.displayName || room.title,
        age: 26,
        gender: '여',
        region: '서울시',
        avatar: room.counterpart?.avatarUrl || null,
      },
      messages: (this.messagesStore[room.id] || []).map((m) => ({
        id: m.id,
        senderId: m.senderAccountId,
        senderName: m.senderName || (m.senderAccountId === 'system' ? '시스템' : '참여자'),
        text: m.content,
        time: m.createdAt,
        type: m.type === 'gift' ? 'GIFT' : 'TEXT',
        giftName: m.giftName,
        isFlagged: false,
      })),
    }));
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
        id: openRoom.hostId === guestUserId ? 'u-host' : openRoom.hostId,
        displayName: openRoom.hostName,
        avatarUrl: openRoom.hostAvatar,
        online: true,
      },
      isWaiting: false,
      lastMessage: `${guestName}님이 대화방에 입장했습니다.`,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
      createdAt: new Date().toISOString(),
    };

    this.rooms.unshift(newRoom);
    this.messagesStore[newChatId] = [
      {
        id: `msg-welcome-${newChatId}`,
        chatId: newChatId,
        senderAccountId: 'system',
        content: `🎉 '${openRoom.title}' 대화방이 매칭되었습니다! (${guestName}님이 입장료 ${fee > 0 ? `${fee} ON을 지불하고` : '무료로'} 입장)`,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

    openRoom.matchedCount = (openRoom.matchedCount || 0) + 1;
    this.saveToDisk();

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

