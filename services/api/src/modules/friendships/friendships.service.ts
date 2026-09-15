import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "nestjs-prisma";

const MAX_TRANSACTION_RETRIES = 3;

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (!requesterId) {
      throw new BadRequestException("Missing authenticated user");
    }

    if (requesterId === addresseeId) {
      throw new BadRequestException("Cannot send a friend request to yourself");
    }

    const addressee = await this.prisma.user.findFirst({
      where: {
        id: addresseeId,
        status: "active",
      },
      select: { id: true },
    });

    if (!addressee) {
      throw new NotFoundException("User not found");
    }

    const userPair = [
      { requesterId, addresseeId },
      { requesterId: addresseeId, addresseeId: requesterId },
    ];
    const blockPair = [
      { userId: requesterId, blockedUserId: addresseeId },
      { userId: addresseeId, blockedUserId: requesterId },
    ];

    for (let retryCount = 0; ; retryCount += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const block = await transaction.block.findFirst({
              where: { OR: blockPair },
              select: { id: true },
            });

            if (block) {
              throw new BadRequestException("Friend request is unavailable");
            }

            const friendships = await transaction.friendship.findMany({
              where: { OR: userPair },
              select: { status: true },
            });

            if (
              friendships.some((friendship) => friendship.status === "accepted")
            ) {
              throw new BadRequestException("Friendship already exists");
            }

            if (
              friendships.some(
                (friendship) => friendship.status === "requested",
              )
            ) {
              throw new BadRequestException("Friend request already exists");
            }

            await transaction.friendship.deleteMany({
              where: {
                OR: userPair,
                status: "declined",
              },
            });

            return transaction.friendship.create({
              data: {
                requesterId,
                addresseeId,
                status: "requested",
              },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const shouldRetry =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          retryCount < MAX_TRANSACTION_RETRIES;

        if (!shouldRetry) {
          throw error;
        }
      }
    }
  }

  async acceptRequest(currentUserId: string, id: string) {
    for (let retryCount = 0; ; retryCount += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const request = await transaction.friendship.findFirst({
              where: {
                id,
                addresseeId: currentUserId,
                status: "requested",
              },
              select: { id: true, requesterId: true },
            });

            if (!request) {
              throw new NotFoundException("Friend request not found");
            }

            const block = await transaction.block.findFirst({
              where: {
                OR: [
                  {
                    userId: request.requesterId,
                    blockedUserId: currentUserId,
                  },
                  {
                    userId: currentUserId,
                    blockedUserId: request.requesterId,
                  },
                ],
              },
              select: { id: true },
            });

            if (block) {
              throw new BadRequestException("Friend request is unavailable");
            }

            return transaction.friendship.update({
              where: { id },
              data: { status: "accepted" },
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        );
      } catch (error) {
        const shouldRetry =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034" &&
          retryCount < MAX_TRANSACTION_RETRIES;

        if (!shouldRetry) {
          throw error;
        }
      }
    }
  }

  async declineRequest(currentUserId: string, id: string) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id,
        addresseeId: currentUserId,
        status: "requested",
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    return this.prisma.friendship.update({
      where: { id },
      data: { status: "declined" },
    });
  }

  async cancelRequest(currentUserId: string, id: string) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id,
        requesterId: currentUserId,
        status: "requested",
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException("Friend request not found");
    }

    return this.prisma.friendship.delete({
      where: { id },
    });
  }

  async listRequests(currentUserId: string) {
    if (!currentUserId) {
      throw new BadRequestException("Missing authenticated user");
    }

    const [friendships, blocks] = await Promise.all([
      this.prisma.friendship.findMany({
        where: {
          OR: [{ requesterId: currentUserId }, { addresseeId: currentUserId }],
        },
      }),
      this.prisma.block.findMany({
        where: {
          OR: [{ userId: currentUserId }, { blockedUserId: currentUserId }],
        },
        select: {
          userId: true,
          blockedUserId: true,
        },
      }),
    ]);

    const blockedUserIds = new Set(
      blocks.map((block) =>
        block.userId === currentUserId ? block.blockedUserId : block.userId,
      ),
    );

    return friendships.filter((friendship) => {
      const otherUserId =
        friendship.requesterId === currentUserId
          ? friendship.addresseeId
          : friendship.requesterId;
      return !blockedUserIds.has(otherUserId);
    });
  }
}
