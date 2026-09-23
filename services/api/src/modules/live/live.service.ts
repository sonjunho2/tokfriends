// services/api/src/modules/live/live.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateLiveRoomDto, SendLiveMessageDto } from './dto';

const HOST_INCLUDE = {
  host: {
    select: {
      id: true,
      displayName: true,
      region1: true,
      region2: true,
      profile: {
        select: {
          nickname: true,
          avatarUri: true,
          headline: true,
        },
      },
    },
  },
  hostAccount: {
    select: {
      id: true,
      handle: true,
      displayName: true,
    },
  },
};

function formatRoom(room: any) {
  return {
    id: room.id,
    title: room.title,
    category: room.category,
    status: room.status,
    viewerCount: room.viewerCount,
    totalLikes: room.totalLikes,
    totalGiftsPoints: room.totalGiftsPoints,
    coverUri: room.coverUri || room.host?.profile?.avatarUri || null,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    host: {
      id: room.host.id,
      name:
        room.host.profile?.nickname ||
        room.host.displayName ||
        '호스트',
      avatar: room.host.profile?.avatarUri || null,
      region:
        [room.host.region1, room.host.region2].filter(Boolean).join(' · ') ||
        '지역 미설정',
      headline: room.host.profile?.headline || null,
      targetAccountId: room.hostAccount?.id || null,
    },
  };
}

@Injectable()
export class LiveService {
  constructor(private readonly prisma: PrismaService) {}

  async createRoom(hostUserId: string, dto: CreateLiveRoomDto) {
    if (!hostUserId) {
      throw new BadRequestException('로그인이 필요합니다.');
    }

    const hostAccount = await this.prisma.activityAccount.findFirst({
      where: {
        legacyUserId: hostUserId,
        status: 'active',
      },
      select: { id: true },
    });

    const activeRoom = await this.prisma.liveRoom.findFirst({
      where: {
        hostId: hostUserId,
        status: 'live',
      },
    });

    if (activeRoom) {
      return formatRoom(
        await this.prisma.liveRoom.findUnique({
          where: { id: activeRoom.id },
          include: HOST_INCLUDE,
        }),
      );
    }

    const room = await this.prisma.liveRoom.create({
      data: {
        hostId: hostUserId,
        hostAccountId: hostAccount?.id || null,
        title: dto.title.trim(),
        category: dto.category?.trim() || 'talk',
        coverUri: dto.coverUri?.trim() || null,
        status: 'live',
        viewerCount: 1,
      },
      include: HOST_INCLUDE,
    });

    return formatRoom(room);
  }

  async listActiveRooms() {
    const rooms = await this.prisma.liveRoom.findMany({
      where: { status: 'live' },
      orderBy: [{ viewerCount: 'desc' }, { startedAt: 'desc' }],
      include: HOST_INCLUDE,
    });

    return rooms.map(formatRoom);
  }

  async getRoom(roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: HOST_INCLUDE,
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    return formatRoom(room);
  }

  async endRoom(hostUserId: string, roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    if (room.hostId !== hostUserId) {
      throw new ForbiddenException('라이브를 종료할 권한이 없습니다.');
    }

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        viewerCount: 0,
      },
      include: HOST_INCLUDE,
    });

    return formatRoom(updated);
  }

  async joinRoom(roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.status !== 'live') {
      return { success: false, viewerCount: 0 };
    }

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: { viewerCount: { increment: 1 } },
      select: { viewerCount: true },
    });

    return { success: true, viewerCount: updated.viewerCount };
  }

  async leaveRoom(roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      select: { viewerCount: true, status: true },
    });

    if (!room || room.viewerCount <= 0) {
      return { success: true, viewerCount: 0 };
    }

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: { viewerCount: { decrement: 1 } },
      select: { viewerCount: true },
    });

    return { success: true, viewerCount: Math.max(0, updated.viewerCount) };
  }

  async sendMessage(senderUserId: string, roomId: string, dto: SendLiveMessageDto) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.status !== 'live') {
      throw new BadRequestException('진행 중인 라이브 룸이 아닙니다.');
    }

    const senderAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: senderUserId, status: 'active' },
      select: { id: true },
    });

    const msgType = dto.type || 'chat';
    const giftPoints = dto.giftPoints || null;

    if (msgType === 'like') {
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { totalLikes: { increment: 1 } },
      });
    } else if (msgType === 'gift' && giftPoints) {
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { totalGiftsPoints: { increment: giftPoints } },
      });
    }

    const message = await this.prisma.liveMessage.create({
      data: {
        roomId,
        senderId: senderUserId,
        senderAccountId: senderAccount?.id || null,
        type: msgType,
        content: dto.content.trim(),
        giftPoints,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profile: {
              select: {
                nickname: true,
                avatarUri: true,
              },
            },
          },
        },
      },
    });

    return {
      id: message.id,
      roomId: message.roomId,
      type: message.type,
      content: message.content,
      giftPoints: message.giftPoints,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name:
          message.sender.profile?.nickname ||
          message.sender.displayName ||
          '회원',
        avatar: message.sender.profile?.avatarUri || null,
      },
    };
  }

  async listMessages(roomId: string, limit: number = 40) {
    const messages = await this.prisma.liveMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profile: {
              select: {
                nickname: true,
                avatarUri: true,
              },
            },
          },
        },
      },
    });

    return messages
      .reverse()
      .map((msg) => ({
        id: msg.id,
        roomId: msg.roomId,
        type: msg.type,
        content: msg.content,
        giftPoints: msg.giftPoints,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          name:
            msg.sender.profile?.nickname ||
            msg.sender.displayName ||
            '회원',
          avatar: msg.sender.profile?.avatarUri || null,
        },
      }));
  }
}
