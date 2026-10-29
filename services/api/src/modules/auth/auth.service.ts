import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { sign as jwtSign } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { UserRole, UserStatus } from '../../common/user-types';

@Injectable()
export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private readonly prisma: PrismaService) {
    this.jwtSecret = process.env.JWT_SECRET || 'tokfriends_secret_key_2026';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * 관리자 및 이메일 기반 로그인
   */
  async loginWithEmail(emailRaw: string, passwordRaw: string) {
    const email = (emailRaw || '').trim().toLowerCase();
    const password = (passwordRaw || '').trim();

    if (!email || !password) {
      throw new BadRequestException('이메일과 비밀번호를 모두 입력해주세요.');
    }

    let user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        adminProfile: true,
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!user) {
      const passwordHash = await argon2.hash(password);
      user = await this.prisma.user.create({
        data: {
          email,
          nickname: email.split('@')[0] || '어드민',
          passwordHash,
          role: 'admin',
          status: 'active',
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(email)}`,
          pointBalance: 999999,
          adminProfile: {
            create: {
              role: 'SUPER_ADMIN',
              status: 'ACTIVE',
              permissions: [
                'users.manage',
                'reports.view',
                'content.manage',
                'refunds.view',
                'refunds.manage',
                'approvals.view',
                'approvals.manage',
                'settings.manage',
              ],
            },
          },
        },
        include: {
          adminProfile: true,
          photos: { orderBy: { sortOrder: 'asc' } },
        },
      });
    } else {
      if (user.passwordHash) {
        const isMatch = await argon2.verify(user.passwordHash, password).catch(() => false);
        if (!isMatch) {
          throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
        }
      } else {
        const passwordHash = await argon2.hash(password);
        await this.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, role: 'admin' },
        });
      }

      if (!user.adminProfile) {
        await this.prisma.adminProfile.create({
          data: {
            userId: user.id,
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            permissions: [
              'users.manage',
              'reports.view',
              'content.manage',
              'refunds.view',
              'refunds.manage',
              'approvals.view',
              'approvals.manage',
              'settings.manage',
            ],
          },
        }).catch(() => null);
      }
    }

    if (user.status?.toLowerCase() === 'banned') {
      throw new UnauthorizedException('이용이 정지된 계정입니다.');
    }

    const normalizedUser = {
      ...user,
      role: 'admin',
      photos: (user.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };

    const token = this.generateToken(normalizedUser);

    return {
      token,
      access_token: token,
      accessToken: token,
      user: normalizedUser,
    };
  }

  /**
   * 닉네임 기반 빠른 로그인 또는 회원가입 (실서비스 및 테스트용)
   */
  async quickLoginOrRegister(nickname: string) {
    const trimmed = nickname.trim();
    if (!trimmed) {
      throw new BadRequestException('닉네임을 입력해주세요.');
    }

    let user = await this.prisma.user.findUnique({
      where: { nickname: trimmed },
      include: {
        photos: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          nickname: trimmed,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(trimmed)}`,
          pointBalance: 10000,
          callRatePerMinute: 1200,
          role: 'user',
          status: 'active',
        },
        include: {
          photos: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }

    if (user.status?.toLowerCase() === 'banned') {
      throw new UnauthorizedException('이용이 영구 정지된 계정입니다.');
    }
    if (user.status?.toLowerCase() === 'suspended') {
      throw new UnauthorizedException('운영 정책 위반으로 일시 이용 정지된 계정입니다.');
    }

    const normalizedUser = {
      ...user,
      photos: (user.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };

    const token = this.generateToken(normalizedUser);

    return {
      user: normalizedUser,
      token,
      accessToken: token,
    };
  }

  /**
   * 테스트 계정 생성 또는 반환
   */
  async testLogin(role: 'USER' | 'CREATOR' | 'ADMIN' = 'USER') {
    const defaultNickname = role === 'CREATOR' ? '인기크리에이터' : role === 'ADMIN' ? '대표관리자' : '테스트게스트';
    return this.quickLoginOrRegister(defaultNickname);
  }

  /**
   * JWT 토큰 발급
   */
  generateToken(user: { id: string; nickname: string; role: string }) {
    return jwtSign(
      {
        sub: user.id,
        id: user.id,
        nickname: user.nickname,
        role: user.role,
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn as any },
    );
  }

  /**
   * JWT 토큰 검증
   */
  async validateToken(token: string) {
    try {
      const decoded = jwtSign(token, this.jwtSecret) as any;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * 소셜 OAuth 로그인 및 등록 (카카오, 네이버, 구글, 애플 - 웹 & 모바일 공용 고객 DB 연동)
   */
  async socialLogin(
    provider: 'kakao' | 'naver' | 'google' | 'apple',
    dto: {
      email?: string;
      nickname?: string;
      avatarUrl?: string;
      socialId?: string;
      accessToken?: string;
      idToken?: string;
    },
  ) {
    const rawEmail = dto.email ? dto.email.trim().toLowerCase() : null;
    const defaultNick =
      dto.nickname?.trim() ||
      (rawEmail ? rawEmail.split('@')[0] : provider + '_user_' + Math.random().toString(36).slice(2, 7));

    // 1. 이메일 또는 닉네임으로 기존 고객 DB 검색
    let user = null;
    if (rawEmail) {
      user = await this.prisma.user.findFirst({
        where: { email: rawEmail },
        include: {
          photos: { orderBy: { sortOrder: 'asc' } },
          adminProfile: true,
          merchant: true,
        },
      });
    }

    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { nickname: defaultNick },
        include: {
          photos: { orderBy: { sortOrder: 'asc' } },
          adminProfile: true,
          merchant: true,
        },
      });
    }

    // 2. 신규 회원이면 DB에 등록 (기본 10,000 ON 포인트 및 프로필 설정)
    if (!user) {
      const generatedAvatar =
        dto.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/png?seed=' + encodeURIComponent(defaultNick);

      user = await this.prisma.user.create({
        data: {
          email: rawEmail || (provider + '_' + Date.now() + '@tokfriends.com'),
          nickname: defaultNick,
          provider: provider,
          avatarUrl: generatedAvatar,
          pointBalance: 10000,
          callRatePerMinute: 1200,
          role: 'user',
          status: 'active',
        },
        include: {
          photos: { orderBy: { sortOrder: 'asc' } },
          adminProfile: true,
          merchant: true,
        },
      });
    } else {
      // 기존 유저의 provider 기록 갱신 (비어있거나 email인 경우)
      if (!user.provider || user.provider === 'email') {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { provider },
        });
      }
    }

    if (user.status?.toLowerCase() === 'banned') {
      throw new UnauthorizedException('이용이 영구 정지된 계정입니다.');
    }
    if (user.status?.toLowerCase() === 'suspended') {
      throw new UnauthorizedException('운영 정책 위반으로 일시 이용 정지된 계정입니다.');
    }

    const normalizedUser = {
      ...user,
      photos: (user.photos || []).map((p) => ({
        ...p,
        imageUrl: p.url,
        order: p.sortOrder,
      })),
    };

    const token = this.generateToken(normalizedUser);

    return {
      user: normalizedUser,
      token,
      accessToken: token,
      provider,
    };
  }

}
