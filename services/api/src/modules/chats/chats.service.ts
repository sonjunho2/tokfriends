import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";
import { DirectChatDto, SendMessageDto } from "./dto";

const MAX_TRANSACTION_RETRIES = 3;

function isAccountPairUniqueConflict(error: unknown): boolean {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }
  const target = (error.meta as { target?: string | string[] } | undefined)
    ?.target;
  if (Array.isArray(target)) {
    return target.includes("accountAId") && target.includes("accountBId");
  }
  return (
    typeof target === "string" &&
    ((target.includes("accountAId") && target.includes("accountBId")) ||
      target.includes("Chat_accountAId_accountBId_key"))
  );
}
function isTransactionConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2034"
  );
}

const chatInclude = Prisma.validator<Prisma.ChatInclude>()({
  userA: { select: { id: true } },
  userB: { select: { id: true } },
  accountA: { select: { id: true, handle: true, displayName: true } },
  accountB: { select: { id: true, handle: true, displayName: true } },
});
type ChatWithRelations = Prisma.ChatGetPayload<{ include: typeof chatInclude }>;
const directAccountSelect = Prisma.validator<Prisma.ActivityAccountSelect>()({
  id: true,
  ownerId: true,
  handle: true,
  displayName: true,
  owner: {
    select: {
      legacyUserId: true,
      legacyUser: { select: { status: true } },
    },
  },
});
type DirectAccount = Prisma.ActivityAccountGetPayload<{
  select: typeof directAccountSelect;
}>;
type DirectRoomResponse = {
  id: string;
  title: string;
  participants: Array<{
    id: string;
    handle: string | null;
    displayName: string | null;
  }>;
};
type SendMessageResponse = {
  id: string;
  chatId: string;
  senderAccountId: string;
  type: string;
  content: string;
  translatedContent: string | null;
  createdAt: Date;
};

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    currentUserId: string | undefined,
    actorAccountId?: string | null,
  ) {
    if (!currentUserId)
      throw new BadRequestException("Missing authenticated user");
    if (!actorAccountId)
      throw new ForbiddenException("Active activity account required");
    const actor = await this.prisma.activityAccount.findFirst({
      where: {
        id: actorAccountId,
        status: "active",
        owner: {
          status: "active",
          legacyUserId: currentUserId,
          legacyUser: { status: "active" },
        },
      },
      select: {
        id: true,
        ownerId: true,
        owner: { select: { legacyUserId: true } },
      },
    });
    if (!actor?.owner.legacyUserId)
      throw new ForbiddenException("Active activity account required");
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [
          { userId: actor.owner.legacyUserId },
          { blockedUserId: actor.owner.legacyUserId },
        ],
      },
      select: { userId: true, blockedUserId: true },
    });
    const blocked = blocks.map((b) =>
      b.userId === actor.owner.legacyUserId ? b.blockedUserId : b.userId,
    );
    const chats = await this.prisma.chat.findMany({
      where: {
        OR: [
          {
            accountAId: actorAccountId,
            userAId: actor.owner.legacyUserId,
            accountBId: { not: null },
            accountB: {
              is: {
                status: "active",
                owner: {
                  status: "active",
                  legacyUserId: blocked.length
                    ? { notIn: blocked }
                    : { not: null },
                  legacyUser: { status: "active" },
                },
              },
            },
          },
          {
            accountBId: actorAccountId,
            userBId: actor.owner.legacyUserId,
            accountAId: { not: null },
            accountA: {
              is: {
                status: "active",
                owner: {
                  status: "active",
                  legacyUserId: blocked.length
                    ? { notIn: blocked }
                    : { not: null },
                  legacyUser: { status: "active" },
                },
              },
            },
          },
        ],
      },
      take: 20,
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      include: {
        accountA: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            status: true,
            owner: {
              select: {
                status: true,
                legacyUserId: true,
                legacyUser: { select: { status: true } },
              },
            },
          },
        },
        accountB: {
          select: {
            id: true,
            handle: true,
            displayName: true,
            status: true,
            owner: {
              select: {
                status: true,
                legacyUserId: true,
                legacyUser: { select: { status: true } },
              },
            },
          },
        },
      },
    });
    return chats.flatMap((chat) => {
      const counterpart =
        chat.accountAId === actorAccountId ? chat.accountB : chat.accountA;
      const counterpartUserId = counterpart?.owner.legacyUserId;
      if (!counterpart || !counterpartUserId) return [];
      const aligned =
        chat.accountAId === actorAccountId
          ? chat.userAId === actor.owner.legacyUserId &&
            chat.userBId === counterpartUserId
          : chat.userBId === actor.owner.legacyUserId &&
            chat.userAId === counterpartUserId;
      if (!aligned) return [];
      return [
        {
          id: chat.id,
          counterpart: {
            id: counterpart.id,
            handle: counterpart.handle,
            displayName: counterpart.displayName,
          },
          lastMessageAt: chat.lastMessageAt,
        },
      ];
    });
  }

  async send(
    currentUserId: string | undefined,
    actorAccountId: string | null | undefined,
    dto: SendMessageDto,
  ): Promise<SendMessageResponse> {
    if (!currentUserId)
      throw new BadRequestException("Missing authenticated user");
    if (!actorAccountId)
      throw new ForbiddenException("Active activity account required");
    for (let attempt = 0; attempt < MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const actor = await tx.activityAccount.findFirst({
              where: {
                id: actorAccountId,
                status: "active",
                owner: {
                  status: "active",
                  legacyUserId: currentUserId,
                  legacyUser: { status: "active" },
                },
              },
              select: directAccountSelect,
            });
            if (!actor?.owner.legacyUserId)
              throw new ForbiddenException("Active activity account required");
            const chat = await tx.chat.findFirst({
              where: {
                id: dto.chatId,
                OR: [
                  {
                    accountAId: actorAccountId,
                    userAId: actor.owner.legacyUserId,
                    accountBId: { not: null },
                    accountB: {
                      is: {
                        status: "active",
                        owner: {
                          status: "active",
                          legacyUserId: { not: null },
                          legacyUser: { status: "active" },
                        },
                      },
                    },
                  },
                  {
                    accountBId: actorAccountId,
                    userBId: actor.owner.legacyUserId,
                    accountAId: { not: null },
                    accountA: {
                      is: {
                        status: "active",
                        owner: {
                          status: "active",
                          legacyUserId: { not: null },
                          legacyUser: { status: "active" },
                        },
                      },
                    },
                  },
                ],
              },
              select: {
                id: true,
                userAId: true,
                userBId: true,
                accountAId: true,
                accountBId: true,
                accountA: {
                  select: {
                    id: true,
                    ownerId: true,
                    owner: { select: { legacyUserId: true } },
                  },
                },
                accountB: {
                  select: {
                    id: true,
                    ownerId: true,
                    owner: { select: { legacyUserId: true } },
                  },
                },
              },
            });
            if (!chat) throw new NotFoundException("Chat not found");
            const counterpart =
              chat.accountAId === actorAccountId
                ? chat.accountB
                : chat.accountA;
            const counterpartUserId = counterpart?.owner.legacyUserId;
            const aligned =
              chat.accountAId === actorAccountId
                ? chat.userBId === counterpartUserId
                : chat.userAId === counterpartUserId;
            if (
              !counterpartUserId ||
              !aligned ||
              counterpart.ownerId === actor.ownerId ||
              counterpartUserId === actor.owner.legacyUserId
            )
              throw new ConflictException("Chat is unavailable");
            const block = await tx.block.findFirst({
              where: {
                OR: [
                  {
                    userId: actor.owner.legacyUserId,
                    blockedUserId: counterpartUserId,
                  },
                  {
                    userId: counterpartUserId,
                    blockedUserId: actor.owner.legacyUserId,
                  },
                ],
              },
              select: { id: true },
            });
            if (block) throw new ForbiddenException("Chat is unavailable");
            const now = new Date();
            const message = await tx.message.create({
              data: {
                chatId: dto.chatId,
                senderId: actor.owner.legacyUserId,
                senderAccountId: actor.id,
                content: dto.content,
                createdAt: now,
              },
              select: {
                id: true,
                chatId: true,
                senderAccountId: true,
                type: true,
                content: true,
                translatedContent: true,
                createdAt: true,
              },
            });
            await tx.chat.update({
              where: { id: chat.id },
              data: { lastMessageAt: now },
            });
            return {
              ...message,
              senderAccountId: actor.id,
            };
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        if (!isTransactionConflict(error)) throw error;
      }
    }
    throw new ConflictException("Chat is unavailable");
  }

  async ensureDirectRoom(
    currentUserId: string,
    actorAccountId: string | undefined,
    dto: DirectChatDto,
  ): Promise<DirectRoomResponse> {
    if (!currentUserId)
      throw new BadRequestException("Missing authenticated user");
    if (!actorAccountId)
      throw new ForbiddenException("Active activity account required");
    if (!dto.targetAccountId && !dto.targetUserId)
      throw new BadRequestException("Chat target is invalid");
    for (let attempt = 0; attempt < MAX_TRANSACTION_RETRIES; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (tx) => {
            const actor = await tx.activityAccount.findFirst({
              where: {
                id: actorAccountId,
                status: "active",
                owner: { status: "active", legacyUserId: currentUserId },
              },
              select: {
                id: true,
                ownerId: true,
                handle: true,
                displayName: true,
                owner: {
                  select: {
                    legacyUserId: true,
                    legacyUser: { select: { status: true } },
                  },
                },
              },
            });
            if (!actor?.owner.legacyUserId)
              throw new ForbiddenException("Active activity account required");
            const target = dto.targetAccountId
              ? await tx.activityAccount.findFirst({
                  where: {
                    id: dto.targetAccountId,
                    status: "active",
                    owner: { status: "active" },
                  },
                  select: {
                    id: true,
                    ownerId: true,
                    handle: true,
                    displayName: true,
                    owner: {
                      select: {
                        legacyUserId: true,
                        legacyUser: { select: { status: true } },
                      },
                    },
                  },
                })
              : await this.resolveLegacyTarget(tx, dto.targetUserId!);
            if (!target)
              throw new NotFoundException("Activity account not found");
            if (!target.owner.legacyUserId)
              throw new BadRequestException("Chat is unavailable");
            if (
              !target.owner.legacyUser ||
              target.owner.legacyUser.status !== "active"
            )
              throw new NotFoundException("Activity account not found");
            if (
              dto.targetAccountId &&
              dto.targetUserId &&
              target.owner.legacyUserId !== dto.targetUserId
            )
              throw new BadRequestException("Chat target is invalid");
            if (
              actor.id === target.id ||
              actor.ownerId === target.ownerId ||
              actor.owner.legacyUserId === target.owner.legacyUserId
            )
              throw new BadRequestException(
                "Cannot create a conversation with yourself",
              );
            const blocked = await tx.block.findFirst({
              where: {
                OR: [
                  {
                    userId: actor.owner.legacyUserId,
                    blockedUserId: target.owner.legacyUserId,
                  },
                  {
                    userId: target.owner.legacyUserId,
                    blockedUserId: actor.owner.legacyUserId,
                  },
                ],
              },
              select: { id: true },
            });
            if (blocked) throw new ForbiddenException("Chat is unavailable");
            const [a, b] = [actor, target].sort((x, y) =>
              x.id.localeCompare(y.id),
            );
            const userAId = a.owner.legacyUserId!;
            const userBId = b.owner.legacyUserId!;
            const rooms = await tx.chat.findMany({
              where: {
                OR: [
                  { accountAId: a.id, accountBId: b.id },
                  { accountAId: b.id, accountBId: a.id },
                ],
              },
              include: chatInclude,
              take: 2,
            });
            if (rooms.length > 1)
              throw new ConflictException("Chat is unavailable");
            let room = rooms[0];
            if (room) {
              if (
                !room.accountA ||
                !room.accountB ||
                new Set([room.userAId, room.userBId]).size !== 2 ||
                ![room.userAId, room.userBId].includes(userAId) ||
                ![room.userAId, room.userBId].includes(userBId)
              )
                throw new ConflictException("Chat is unavailable");
            } else {
              const legacy = await tx.chat.findMany({
                where: {
                  accountAId: null,
                  accountBId: null,
                  OR: [
                    { userAId, userBId },
                    { userAId: userBId, userBId: userAId },
                  ],
                },
                include: chatInclude,
                take: 2,
              });
              if (legacy.length > 1)
                throw new ConflictException("Chat is unavailable");
              room = legacy[0]
                ? await tx.chat.update({
                    where: { id: legacy[0].id },
                    data: {
                      accountAId: a.id,
                      accountBId: b.id,
                      userAId,
                      userBId,
                    },
                    include: chatInclude,
                  })
                : await tx.chat.create({
                    data: {
                      accountAId: a.id,
                      accountBId: b.id,
                      userAId,
                      userBId,
                      lastMessageAt: new Date(),
                    },
                    include: chatInclude,
                  });
            }
            return this.serializeDirectChat(room, actorAccountId);
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error: unknown) {
        const retryablePairConflict = isAccountPairUniqueConflict(error);
        if (retryablePairConflict && attempt === MAX_TRANSACTION_RETRIES - 1) {
          throw new ConflictException("Chat is unavailable");
        }
        if (!isTransactionConflict(error) && !retryablePairConflict) {
          throw error;
        }
      }
    }
    throw new ConflictException("Chat is unavailable");
  }

  private async resolveLegacyTarget(
    tx: Prisma.TransactionClient,
    targetUserId: string,
  ): Promise<DirectAccount | null> {
    const user = await tx.user.findFirst({
      where: { id: targetUserId, status: "active" },
      select: {
        ownerBridge: {
          select: {
            status: true,
            legacyUserId: true,
            activityAccounts: {
              where: {
                status: "active",
                OR: [{ isPrimary: true }, { legacyUserId: targetUserId }],
              },
              orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
              take: 1,
              select: {
                id: true,
                ownerId: true,
                handle: true,
                displayName: true,
                owner: {
                  select: {
                    legacyUserId: true,
                    legacyUser: { select: { status: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    const owner = user?.ownerBridge;
    if (
      !owner ||
      owner.status !== "active" ||
      owner.legacyUserId !== targetUserId
    )
      return null;
    return owner.activityAccounts[0] ?? null;
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
    if (block)
      throw new ForbiddenException("Chat is unavailable for blocked users.");
  }

  private serializeDirectChat(
    chat: ChatWithRelations,
    actorAccountId: string,
  ): DirectRoomResponse {
    if (!chat.accountA || !chat.accountB)
      throw new ConflictException("Chat is unavailable");
    const participants = [chat.accountA, chat.accountB];
    const target =
      participants.find((p) => p.id !== actorAccountId) ?? participants[0];
    return {
      id: chat.id,
      title: target.displayName || target.handle || "대화",
      participants: participants.map((p) => ({
        id: p.id,
        handle: p.handle,
        displayName: p.displayName,
      })),
    };
  }
}
