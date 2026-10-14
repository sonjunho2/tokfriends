import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { UserStatus } from '../../common/user-types';

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

    if (!user || user.status?.toLowerCase() === 'banned') {
      return null;
    }

    return {
      id: user.id,
      nickname: user.nickname,
      role: user.role?.toLowerCase() ?? 'user',
      status: user.status?.toLowerCase() ?? 'active',
    };
  }
}
