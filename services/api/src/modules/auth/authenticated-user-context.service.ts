import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UserStatus } from '@prisma/client';

type DecodedJwtPayload = {
  sub?: string;
  id?: string;
  nickname?: string;
  role?: string;
};

@Injectable()
export class AuthenticatedUserContextService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromPayload(payload: unknown) {
    const decodedPayload = payload as DecodedJwtPayload | null;
    const userId = decodedPayload?.sub || decodedPayload?.id;
    if (!userId) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status === UserStatus.BANNED) {
      return null;
    }

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      status: user.status,
    };
  }
}
