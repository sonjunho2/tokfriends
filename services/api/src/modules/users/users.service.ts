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
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!user) return null;
    return {
      ...user,
      photos: (user.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };
  }

  async byPublicId(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, status: { in: ['ACTIVE', 'active'] } },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        bio: true,
        callRatePerMinute: true,
        role: true,
        photos: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            url: true,
            sortOrder: true,
            isPrimary: true,
          },
        },
      },
    });
    if (!user) return null;
    return {
      ...user,
      photos: (user.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };
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

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.nickname ? { nickname: data.nickname } : {}),
        ...(data.bio !== undefined ? { bio: data.bio } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.callRatePerMinute !== undefined ? { callRatePerMinute: data.callRatePerMinute } : {}),
      },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return {
      ...updated,
      photos: (updated.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };
  }

  async addPhoto(userId: string, imageUrl: string, order?: number) {
    const count = await this.prisma.userPhoto.count({ where: { userId } });
    if (count >= 9) {
      throw new BadRequestException('사진은 최대 9장까지만 등록 가능합니다.');
    }

    const created = await this.prisma.userPhoto.create({
      data: {
        userId,
        url: imageUrl,
        sortOrder: order !== undefined ? order : count + 1,
      },
    });

    return {
      ...created,
      imageUrl: created.url,
      order: created.sortOrder,
    };
  }

  async deletePhoto(userId: string, photoId: string) {
    return this.prisma.userPhoto.deleteMany({
      where: { id: photoId, userId },
    });
  }

  async searchUsers(filters: UserSearchFilters) {
    const limit = filters.limit ? Math.min(filters.limit, 50) : 20;
    const users = await this.prisma.user.findMany({
      where: {
        ...(filters.keyword ? { nickname: { contains: filters.keyword } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        photos: {
          take: 3,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return users.map((u) => ({
      ...u,
      photos: (u.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    }));
  }
}
