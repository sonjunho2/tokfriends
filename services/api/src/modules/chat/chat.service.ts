import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

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
}

export interface ChatRoomItem {
  id: string;
  title: string;
  category: string;
  entryFee: number;
  isGroup: boolean;
  participantIds: string[];
  counterpart?: {
    id: string;
    displayName: string;
    handle?: string;
    avatarUrl?: string | null;
    online?: boolean;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

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

  async getChats(userId?: string): Promise<ChatRoomItem[]> {
    return this.rooms.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime(),
    );
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

    return newRoom;
  }

  async createChatRoom(
    userId: string,
    dto: { title: string; category?: string; entryFee?: number; isGroup?: boolean },
  ): Promise<ChatRoomItem> {
    const title = String(dto.title || '').trim();
    const fee = Math.max(0, Number(dto.entryFee || 0));
    const newRoom: ChatRoomItem = {
      id: `chat-room-${Date.now()}`,
      title,
      category: dto.category || '친목',
      entryFee: fee,
      isGroup: Boolean(dto.isGroup),
      participantIds: [userId],
      counterpart: {
        id: `acc-${Date.now()}`,
        displayName: title,
        avatarUrl: null,
      },
      lastMessage: '대화방이 개설되었습니다.',
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
        content: `🎉 '${title}' 대화방이 생성되었습니다! (입장료: ${fee > 0 ? `${fee} ON` : '무료'})`,
        type: 'text',
        createdAt: new Date().toISOString(),
      },
    ];

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
    dto: { chatId: string; content: string; clientMessageId?: string; type?: string },
  ): Promise<ChatMessageItem> {
    const { chatId, content, type = 'text' } = dto;
    const msg: ChatMessageItem = {
      id: dto.clientMessageId || `msg-${Date.now()}`,
      chatId,
      senderAccountId: userId,
      content,
      type,
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

    return msg;
  }

  async deleteChat(userId: string, chatId: string): Promise<{ ok: boolean }> {
    const idx = this.rooms.findIndex((r) => r.id === chatId);
    if (idx !== -1) {
      this.rooms.splice(idx, 1);
    }
    delete this.messagesStore[chatId];
    return { ok: true };
  }
}
