import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { sign as jwtSign } from 'jsonwebtoken';
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
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          nickname: trimmed,
          avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(trimmed)}`,
          pointBalance: 10000, // 기본 10,000 온(ON) 지급
          callRatePerMinute: 1200,
          role: 'user',
          status: 'active',
        },
        include: {
          photos: {
            orderBy: { order: 'asc' },
          },
        },
      });
    }

    if (user.status === UserStatus.BANNED) {
      throw new UnauthorizedException('이용이 영구 정지된 계정입니다.');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('운영 정책 위반으로 일시 이용 정지된 계정입니다.');
    }

    const token = this.generateToken(user);

    return {
      user,
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
}
