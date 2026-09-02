import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (!requesterId) {
      throw new BadRequestException('Missing authenticated user');
    }

    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const addressee = await this.prisma.user.findFirst({
      where: {
        id: addresseeId,
        status: 'active',
      },
      select: { id: true },
    });

    if (!addressee) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.friendship.create({
      data: {
        requesterId,
        addresseeId,
        status: 'requested',
      },
    });
  }

  async acceptRequest(currentUserId: string, id: string) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id,
        addresseeId: currentUserId,
        status: 'requested',
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    return this.prisma.friendship.update({
      where: { id },
      data: { status: 'accepted' },
    });
  }

  async declineRequest(currentUserId: string, id: string) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id,
        addresseeId: currentUserId,
        status: 'requested',
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    return this.prisma.friendship.update({
      where: { id },
      data: { status: 'declined' },
    });
  }

  async cancelRequest(currentUserId: string, id: string) {
    const request = await this.prisma.friendship.findFirst({
      where: {
        id,
        requesterId: currentUserId,
        status: 'requested',
      },
      select: { id: true },
    });

    if (!request) {
      throw new NotFoundException('Friend request not found');
    }

    return this.prisma.friendship.delete({
      where: { id },
    });
  }

  async listRequests(currentUserId: string) {
    if (!currentUserId) {
      throw new BadRequestException('Missing authenticated user');
    }

    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: currentUserId },
          { addresseeId: currentUserId },
        ],
      },
    });
  }
}