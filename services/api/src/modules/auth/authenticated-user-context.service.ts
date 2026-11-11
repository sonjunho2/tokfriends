import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';

type DecodedJwtPayload = {
  sub?: string;
  id?: string;
  nickname?: string;
  role?: string;
};

@Injectable()
export class AuthenticatedUserContextService {
  private readonly dataDir = path.join(process.cwd(), 'data');
  private readonly profilesFilePath = path.join(this.dataDir, 'user-profiles.json');

  constructor(private readonly prisma: PrismaService) {}

  private getExtendedProfile(userId: string): any {
    try {
      if (fs.existsSync(this.profilesFilePath)) {
        const raw = fs.readFileSync(this.profilesFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return parsed?.[userId] || {};
      }
    } catch {}
    return {};
  }

  async resolveFromPayload(payload: unknown) {
    const decodedPayload = payload as DecodedJwtPayload | null;
    const userId = decodedPayload?.sub || decodedPayload?.id;
    if (!userId) {
      return null;
    }

    let user: any = null;
    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          nickname: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          bio: true,
          pointBalance: true,
          role: true,
          status: true,
        },
      });
    } catch {
      // DB connection unavailable - fallback to decoded payload
    }

    if (!user) {
      const ext = this.getExtendedProfile(userId);
      const nickname = decodedPayload?.nickname || ext.nickname || '회원';
      return {
        id: userId,
        nickname,
        displayName: nickname,
        email: (decodedPayload as any)?.email || null,
        avatarUrl: ext.avatarUrl || ext.avatarUri || null,
        avatarUri: ext.avatarUrl || ext.avatarUri || null,
        pointBalance: 100000,
        bio: ext.bio || '',
        role: decodedPayload?.role?.toLowerCase() ?? 'user',
        status: 'active',
      };
    }

    if (user.status?.toLowerCase() === 'banned') {
      return null;
    }

    const ext = this.getExtendedProfile(user.id);
    const nickname = user.nickname || ext.nickname || user.displayName || '회원';
    const displayName = user.displayName || nickname;
    const avatarUrl = user.avatarUrl || ext.avatarUrl || ext.avatarUri || null;

    return {
      id: user.id,
      nickname,
      displayName,
      email: user.email,
      avatarUrl,
      avatarUri: avatarUrl,
      pointBalance: user.pointBalance ?? 0,
      bio: ext.bio || user.bio || '',
      role: user.role?.toLowerCase() ?? 'user',
      status: user.status?.toLowerCase() ?? 'active',
    };
  }
}

