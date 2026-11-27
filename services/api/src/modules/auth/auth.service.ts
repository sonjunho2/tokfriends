import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { sign as jwtSign } from 'jsonwebtoken';
import * as argon2 from 'argon2';
import { UserRole, UserStatus } from '../../common/user-types';

const DEFAULT_SUPER_ADMIN_PERMISSIONS = [
  'users.manage',
  'reports.view',
  'content.manage',
  'refunds.view',
  'refunds.manage',
  'approvals.view',
  'approvals.manage',
  'settings.manage',
];

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor(private readonly prisma: PrismaService) {
    this.jwtSecret = process.env.JWT_SECRET || 'tokfriends_secret_key_2026';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  async onModuleInit() {
    await this.ensureDefaultAdminAccount();
  }

  /**
   * 최초 기본 최고관리자(admin / admin123!!) 자동 시드
   * - Prisma 클라이언트가 username 컬럼을 모를 수 있으므로 Raw SQL로만 처리
   * - 모든 단계가 멱등(idempotent)하게 동작
   */
  async ensureDefaultAdminAccount() {
    try {
      // 1. username 컬럼 보장 (없으면 추가)
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE "AdminProfile" ADD COLUMN IF NOT EXISTS "username" TEXT`,
      ).catch(() => {});
      await this.prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "AdminProfile_username_key" ON "AdminProfile"("username")`,
      ).catch(() => {});

      // 2. 이미 admin 계정이 존재하면 비밀번호/상태만 보장하고 종료
      const rows: Array<{ user_id: string; has_hash: boolean }> = await this.prisma.$queryRawUnsafe(`
        SELECT u.id AS user_id,
               (u."passwordHash" IS NOT NULL) AS has_hash
        FROM "AdminProfile" ap
        JOIN "User" u ON u.id = ap."userId"
        WHERE ap.username = 'admin'
        LIMIT 1
      `);

      if (rows.length > 0) {
        const { user_id, has_hash } = rows[0];
        if (!has_hash) {
          const passwordHash = await argon2.hash('admin123!!');
          await this.prisma.$executeRawUnsafe(
            `UPDATE "User" SET "passwordHash" = $1, role = 'admin', status = 'active' WHERE id = $2`,
            passwordHash, user_id,
          );
        }
        // 항상 ACTIVE 상태 보장
        await this.prisma.$executeRawUnsafe(
          `UPDATE "AdminProfile" SET status = 'ACTIVE' WHERE username = 'admin'`,
        );
        return;
      }

      // 3. admin 계정 없음 → 레거시 정리 후 새로 생성
      // username 없는 AdminProfile 행 삭제 (컬럼이 이미 있으므로 안전)
      await this.prisma.$executeRawUnsafe(
        `DELETE FROM "AdminProfile" WHERE "username" IS NULL`,
      ).catch(() => {});

      // admin@mocco.local User가 있는지 확인
      const existingRows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
        `SELECT id FROM "User" WHERE email = 'admin@mocco.local' LIMIT 1`,
      );

      const passwordHash = await argon2.hash('admin123!!');

      if (existingRows.length > 0) {
        const userId = existingRows[0].id;
        // User 업데이트
        await this.prisma.$executeRawUnsafe(
          `UPDATE "User" SET "passwordHash" = $1, role = 'admin', status = 'active' WHERE id = $2`,
          passwordHash, userId,
        );
        // AdminProfile 생성 (없을 경우)
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "AdminProfile" ("userId", "username", "role", "status", "permissions", "twoFactorEnabled", "createdAt", "updatedAt")
          VALUES ($1, 'admin', 'SUPER_ADMIN', 'ACTIVE', $2, false, NOW(), NOW())
          ON CONFLICT ("userId") DO UPDATE SET username = 'admin', status = 'ACTIVE', "updatedAt" = NOW()
        `, userId, JSON.stringify(DEFAULT_SUPER_ADMIN_PERMISSIONS));
      } else {
        // 닉네임 충돌 체크
        const nickRows: Array<{ id: string }> = await this.prisma.$queryRawUnsafe(
          `SELECT id FROM "User" WHERE nickname = 'admin' LIMIT 1`,
        );
        const safeNickname = nickRows.length > 0 ? `mocco_admin_${Date.now().toString().slice(-4)}` : 'admin';

        const newId = require('crypto').randomUUID();
        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "User" (id, email, nickname, "displayName", "passwordHash", provider, role, status, "pointBalance", "createdAt", "updatedAt")
          VALUES ($1, 'admin@mocco.local', $2, '최고관리자', $3, 'admin', 'admin', 'active', 0, NOW(), NOW())
        `, newId, safeNickname, passwordHash);

        await this.prisma.$executeRawUnsafe(`
          INSERT INTO "AdminProfile" ("userId", "username", "role", "status", "permissions", "twoFactorEnabled", "createdAt", "updatedAt")
          VALUES ($1, 'admin', 'SUPER_ADMIN', 'ACTIVE', $2, false, NOW(), NOW())
        `, newId, JSON.stringify(DEFAULT_SUPER_ADMIN_PERMISSIONS));
      }

      this.logger.log('Default super admin account seeded successfully (username: admin)');
    } catch (err: any) {
      this.logger.warn(`ensureDefaultAdminAccount notice: ${err?.message || err}`);
    }
  }

  /**
   * 관리자 전용 아이디/비밀번호 로그인 (일반 회원 로그인과 완전 분리)
   */
  async adminLogin(identifierRaw: string, passwordRaw: string) {
    const cleanId = (identifierRaw || '').trim().toLowerCase();
    const password = (passwordRaw || '').trim();

    if (!cleanId || !password) {
      throw new BadRequestException('관리자 아이디와 비밀번호를 모두 입력해주세요.');
    }

    await this.ensureDefaultAdminAccount();

    const profile = await this.prisma.adminProfile.findFirst({
      where: {
        OR: [
          { username: cleanId },
          { user: { email: cleanId } },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            displayName: true,
            passwordHash: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!profile || !profile.user || !profile.user.passwordHash) {
      throw new UnauthorizedException('관리자 아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    if (profile.status !== 'ACTIVE' || profile.user.status === 'suspended' || profile.user.status === 'banned') {
      throw new ForbiddenException('비활성화되거나 정지된 관리자 계정입니다.');
    }

    const valid = await argon2.verify(profile.user.passwordHash, password).catch(() => false);
    if (!valid) {
      throw new UnauthorizedException('관리자 아이디 또는 비밀번호가 올바르지 않습니다.');
    }

    await this.prisma.adminProfile.update({
      where: { userId: profile.userId },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken({
      id: profile.user.id,
      nickname: profile.username || profile.user.nickname || 'admin',
      role: profile.role || 'ADMIN',
    });

    return {
      ok: true,
      token,
      accessToken: token,
      access_token: token,
      user: {
        id: profile.user.id,
        username: profile.username || profile.user.email,
        email: profile.user.email,
        nickname: profile.user.displayName || profile.username || profile.user.nickname,
        displayName: profile.user.displayName || profile.username,
        role: profile.role,
        status: profile.status,
        adminProfile: {
          username: profile.username,
          role: profile.role,
          status: profile.status,
          permissions: profile.permissions,
        },
      },
    };
  }

  /**
   * 이메일 회원가입 및 약관 동의 내역 저장
   */
  async signupWithEmail(dto: {
    email: string;
    password: string;
    displayName?: string;
    nickname?: string;
    gender?: string;
    dob?: string;
    region?: string;
    bio?: string;
    termsAgreed?: boolean;
    privacyAgreed?: boolean;
    locationAgreed?: boolean;
    marketingAgreed?: boolean;
  }) {
    const email = (dto.email || '').trim().toLowerCase();
    const password = (dto.password || '').trim();
    if (!email || !password) {
      throw new BadRequestException('이메일과 비밀번호를 모두 입력해주세요.');
    }
    if (password.length < 6) {
      throw new BadRequestException('비밀번호는 최소 6자 이상이어야 합니다.');
    }
    if (dto.termsAgreed === false || dto.privacyAgreed === false) {
      throw new BadRequestException('필수 이용약관 및 개인정보 수집·이용에 동의해야 합니다.');
    }

    const existing = await this.prisma.user.findFirst({ where: { email } });
    if (existing) {
      throw new ConflictException('이미 가입된 이메일 주소입니다.');
    }

    const rawNick = (dto.nickname || dto.displayName || email.split('@')[0] || '모꼬회원').trim();
    let finalNick = rawNick;
    const nickTaken = await this.prisma.user.findUnique({ where: { nickname: finalNick } });
    if (nickTaken) {
      finalNick = `${rawNick}_${Math.random().toString(36).slice(2, 6)}`;
    }

    const now = new Date();
    const passwordHash = await argon2.hash(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        nickname: finalNick,
        displayName: (dto.displayName || finalNick).trim(),
        passwordHash,
        provider: 'email',
        role: 'user',
        status: 'active',
        region1: dto.region?.trim() || null,
        bio: dto.bio?.trim() || '안녕하세요! 모꼬에서 소통해요.',
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(email)}`,
        pointBalance: 10000,
        termsAgreedAt: now,
        privacyAgreedAt: now,
        locationAgreedAt: dto.locationAgreed ? now : null,
        marketingAgreed: Boolean(dto.marketingAgreed),
        marketingAgreedAt: dto.marketingAgreed ? now : null,
      },
      include: {
        adminProfile: true,
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    const token = this.generateToken({
      id: user.id,
      nickname: user.nickname,
      role: user.role,
    });

    return {
      ok: true,
      token,
      accessToken: token,
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        displayName: user.displayName,
        role: user.role,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        pointBalance: user.pointBalance,
        marketingAgreed: user.marketingAgreed,
      },
    };
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

    const isTest01 = email === 'test01@te.te';
    const isTest02 = email === 'test02@te.te';
    const isTestUser = isTest01 || isTest02;

    let user = await this.prisma.user.findFirst({
      where: { email },
      include: {
        adminProfile: true,
        photos: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!user) {
      const passwordHash = await argon2.hash(password);
      const defaultRole = 'user';
      const defaultNickname = isTest01
        ? '테스터01'
        : (isTest02 ? '테스터02' : (email.split('@')[0] || '사용자'));
      const defaultDisplayName = isTest01
        ? '테스터01(스트리머)'
        : (isTest02 ? '테스터02(시청자)' : defaultNickname);
      const defaultPoints = isTest01 ? 100000 : (isTest02 ? 500000 : 50000);
      const defaultBio = isTest01
        ? '모꼬 공식 라이브 스트리머 테스트 계정'
        : (isTest02 ? '모꼬 라이브 시청 및 꿀떡 선물 테스트 계정' : '안녕하세요! 모꼬에서 소통해요.');
      const defaultAvatar = isTest01
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500'
        : (isTest02 ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500' : `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(email)}`);

      user = await this.prisma.user.create({
        data: {
          email,
          nickname: defaultNickname,
          displayName: defaultDisplayName,
          passwordHash,
          role: defaultRole,
          status: 'active',
          avatarUrl: defaultAvatar,
          bio: defaultBio,
          pointBalance: defaultPoints,
        },
        include: {
          adminProfile: true,
          photos: { orderBy: { sortOrder: 'asc' } },
        },
      });
    } else {
      if (isTestUser) {
        // test01, test02 일반 가입자로 정식 동기화
        const passwordHash = await argon2.hash(password);
        const ensurePoints = isTest01 ? 100000 : 500000;
        const currentPoints = user.pointBalance || 0;
        const updatedPoints = currentPoints < 50000 ? ensurePoints : currentPoints;

        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            passwordHash,
            role: 'user', // 일반 사용자 role: 'user'
            status: 'active',
            pointBalance: updatedPoints,
            nickname: isTest01 ? '테스터01' : (isTest02 ? '테스터02' : user.nickname),
            displayName: isTest01 ? '테스터01(스트리머)' : (isTest02 ? '테스터02(시청자)' : user.displayName),
            bio: isTest01 ? '모꼬 공식 라이브 스트리머 테스트 계정' : (isTest02 ? '모꼬 라이브 시청 및 꿀떡 선물 테스트 계정' : user.bio),
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
            data: { passwordHash },
          });
        }
      }
    }

    if (user.status?.toLowerCase() === 'banned') {
      throw new UnauthorizedException('이용이 정지된 계정입니다.');
    }

    const effectiveRole = isTestUser
      ? 'user'
      : (user.adminProfile ? 'admin' : (user.role || 'user')).toLowerCase();

    const normalizedUser = {
      ...user,
      role: effectiveRole,
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
      termsAgreed?: boolean;
      privacyAgreed?: boolean;
      locationAgreed?: boolean;
      marketingAgreed?: boolean;
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

      const now = new Date();
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
          termsAgreedAt: dto.termsAgreed !== false ? now : null,
          privacyAgreedAt: dto.privacyAgreed !== false ? now : null,
          locationAgreedAt: dto.locationAgreed ? now : null,
          marketingAgreed: Boolean(dto.marketingAgreed),
          marketingAgreedAt: dto.marketingAgreed ? now : null,
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
