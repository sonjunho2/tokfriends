import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class FriendshipsService {
  constructor(private prisma: PrismaService) {}

  // 친구 요청 생성
  async sendRequest(requesterId: string, addresseeId: string) {
    return this.prisma.friendship.create({
      data: { requesterId, addresseeId, status: 'requested' },
    });
  }

  // 요청 수락
  async acceptRequest(id: string) {
    return this.prisma.friendship.update({
      where: { id },
      data: { status: 'accepted' },
    });
  }

  // 요청 거절
  async declineRequest(id: string) {
    return this.prisma.friendship.update({
      where: { id },
      data: { status: 'declined' },
    });
  }

  // 요청 취소/삭제
  async cancelRequest(id: string) {
    return this.prisma.friendship.delete({
      where: { id },
    });
  }

  // 특정 사용자가 주고받은 요청 목록 조회
  async listRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { addresseeId: userId },
        ],
      },
    });
  }
}
