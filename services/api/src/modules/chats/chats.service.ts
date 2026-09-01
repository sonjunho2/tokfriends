// services/api/src/modules/chats/chats.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';

const chatWithUsersInclude = Prisma.validator<Prisma.ChatInclude>()({
  userA: {
    select: {
      id: true,
      displayName: true,
      profile: { select: { nickname: true, avatarUri: true } },
    },
  },
  userB: {
    select: {
      id: true,
      displayName: true,
      profile: { select: { nickname: true, avatarUri: true } },
    },
  },
});

type ChatWithUsers = Prisma.ChatGetPayload<{ include: typeof chatWithUsersInclude }>;

type DirectRoomResponse = {
  id: string;
  title: string;
  participants: Array<{
    id: string;
    displayName: string | null;
    nickname: string | null;
    avatarUri: string | null;
  }>;
};

@Injectable()
export class ChatsService {
    constructor(private readonly prisma: PrismaService) {}

  private readonly chatInclude = chatWithUsersInclude;

  async list() {
    return this.prisma.chat.findMany({ take: 20, orderBy: { lastMessageAt: 'desc' } });
  }

  async send(dto: { chatId: string; senderId: string; content: string }) {
    const msg = await this.prisma.message.create({
      data: { chatId: dto.chatId, senderId: dto.senderId, content: dto.content },
    });
    await this.prisma.chat.update({ where: { id: dto.chatId }, data: { lastMessageAt: new Date() } });
    return msg;
  }

  async createRoom(dto: { userAId: string; userBId: string; title?: string; category?: string }) {
    const chat = await this.prisma.chat.create({
      data: {
        userAId: dto.userAId,
        userBId: dto.userBId,
        lastMessageAt: new Date(),
      },
    });
    return {
      ok: true,
      id: chat.id,
      userAId: chat.userAId,
      userBId: chat.userBId,
      title: dto.title ?? '',
      category: dto.category ?? '',
    };
  }

  async ensureDirectRoom(currentUserId: string, targetUserId: string): Promise<DirectRoomResponse> {
    if (!currentUserId) {
      throw new BadRequestException('Missing authenticated user');
    }

    if (!targetUserId) {
      throw new BadRequestException('targetUserId is required');
    }

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot create a conversation with yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    const chat = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.chat.findFirst({
        where: {
          OR: [
            { userAId: currentUserId, userBId: targetUserId },
            { userAId: targetUserId, userBId: currentUserId },
          ],
        },
        include: this.chatInclude,
      });

      if (existing) {
        return existing;
      }

      return tx.chat.create({
        data: {
          userAId: currentUserId,
          userBId: targetUserId,
          lastMessageAt: new Date(),
        },
        include: this.chatInclude,
      });
    });

    return this.serializeDirectChat(chat, currentUserId);
  }

  private serializeDirectChat(chat: ChatWithUsers, currentUserId: string): DirectRoomResponse {
    const userA = chat.userA;
    const userB = chat.userB;

    const titleSource = chat.userAId === currentUserId ? userB : userA;
    const makeDisplayName = (participant: ChatWithUsers['userA']) =>
      participant.displayName || participant.profile?.nickname || null;

    return {
      id: chat.id,
      title: makeDisplayName(titleSource) ?? '대화',
      participants: [userA, userB].map((participant) => ({
        id: participant.id,
        displayName: participant.displayName ?? null,
        nickname: participant.profile?.nickname ?? null,
        avatarUri: participant.profile?.avatarUri ?? null,
      })),
    };
  }
}
