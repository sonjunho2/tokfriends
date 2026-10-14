import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UserRole, UserStatus } from '../../common/user-types';

export type UserSearchFilters = {
  keyword?: string;
  status?: UserStatus;
  limit?: number;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async byId(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async byPublicId(id: string) {
    return this.prisma.user.findFirst({
      where: { id, status: { in: ['ACTIVE', 'active'] } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        callRatePerMinute: true,
        role: true,
        photos: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            imageUrl: true,
            order: true,
          },
        },
      },
    });
  }

  async getMe(userId: string) {
    const user = await this.byId(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    return user;
  }

  async updateProfile(userId: string, data: { nickname?: string; bio?: string; avatarUrl?: string; callRatePerMinute?: number }) {
    if (data.nickname) {
      const existing = await this.prisma.user.findUnique({
        where: { nickname: data.nickname },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('이미 사용 중인 닉네임입니다.');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname ? { nickname: data.nickname } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.callRatePerMinute !== undefined ? { callRatePerMinute: data.callRatePerMinute } : {}),
      },
      include: {
        photos: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async addPhoto(userId: string, imageUrl: string, order?: number) {
    const count = await this.prisma.userPhoto.count({ where: { userId } });
    if (count >= 9) {
      throw new BadRequestException('사진은 최대 9장까지만 등록 가능합니다.');
    }

    return this.prisma.userPhoto.create({
      data: {
        userId,
        imageUrl,
        order: order !== undefined ? order : count + 1,
      },
    });
  }

  async deletePhoto(userId: string, photoId: string) {
    return this.prisma.userPhoto.deleteMany({
      where: { id: photoId, userId },
    });
  }

  async searchUsers(filters: UserSearchFilters) {
    const limit = filters.limit ? Math.min(filters.limit, 50) : 20;
    return this.prisma.user.findMany({
      where: {
        ...(filters.keyword ? { nickname: { contains: filters.keyword } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          take: 3,
          orderBy: { order: 'asc' },
        },
      },
    });
  }
}
