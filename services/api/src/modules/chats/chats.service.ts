// services/api/src/modules/chats/chats.service.ts
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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

  async list(currentUserId: string) {
    if (!currentUserId) {
      throw new BadRequestException('Missing authenticated user');
    }

    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [
          { userId: currentUserId },
          { blockedUserId: currentUserId },
        ],
      },
      select: {
        userId: true,
        blockedUserId: true,
      },
    });

    const blockedUserIds = blocks.map((block) =>
      block.userId === currentUserId ? block.blockedUserId : block.userId,
    );

    return this.prisma.chat.findMany({
      where: {
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
        userAId: blockedUserIds.length > 0 ? { notIn: blockedUserIds } : undefined,
        userBId: blockedUserIds.length > 0 ? { notIn: blockedUserIds } : undefined,
      },
      take: 20,
      orderBy: { lastMessageAt: 'desc' },
    });
  }
  async send(currentUserId: string, dto: { chatId: string; content: string }) {
    if (!currentUserId) {
      throw new BadRequestException('Missing authenticated user');
    }

    const chat = await this.prisma.chat.findFirst({
      where: {
        id: dto.chatId,
        OR: [
          { userAId: currentUserId },
          { userBId: currentUserId },
        ],
      },
      select: {
        id: true,
        userAId: true,
        userBId: true,
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const targetUserId =
      chat.userAId === currentUserId ? chat.userBId : chat.userAId;

    await this.ensureUsersCanChat(currentUserId, targetUserId);

    const msg = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        senderId: currentUserId,
        content: dto.content,
      },
    });

    await this.prisma.chat.update({
      where: { id: dto.chatId },
      data: { lastMessageAt: new Date() },
    });

    return msg;
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

    await this.ensureUsersCanChat(currentUserId, targetUserId);

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


  private async ensureUsersCanChat(userId: string, targetUserId: string) {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { userId, blockedUserId: targetUserId },
          { userId: targetUserId, blockedUserId: userId },
        ],
      },
      select: { id: true },
    });

    if (block) {
      throw new ForbiddenException('Chat is unavailable for blocked users.');
    }
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
