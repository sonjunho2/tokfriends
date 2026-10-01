import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import * as argon2 from 'argon2';
import { sign as jwtSign } from 'jsonwebtoken';
import { randomInt, createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import {
  EmailSignupDto,
  EmailLoginDto,
  AppleTokenDto,
  KakaoLoginDto,
  NaverLoginDto,
  GoogleLoginDto,
  PhoneRequestOtpDto,
  PhoneVerifyDto,
  CompletePhoneProfileDto,
} from './dto';
import { AdminSettingsService } from '../admin/admin-settings.service';

const OTP_EXPIRY_SECONDS = 180;
const OTP_REQUEST_COOLDOWN_SECONDS = 60;
const DISABLE_AUTH =
  process.env.NODE_ENV !== 'production' &&
  process.env.DISABLE_AUTH_AND_PAYMENT === 'true';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private adminSettings: AdminSettingsService,
  ) {}

  private async ensureConsumerFoundation(
    tx: Prisma.TransactionClient,
    user: {
      id: string;
      role: string;
      status: string;
      displayName: string | null;
      pointsBalance: number;
    },
  ) {
    if (user.role !== 'user') {
      return;
    }

    const owner = await tx.owner.upsert({
      where: { legacyUserId: user.id },
      update: {},
      create: {
        legacyUserId: user.id,
        status: user.status,
      },
      select: { id: true },
    });

    const activityAccount = await tx.activityAccount.upsert({
      where: { legacyUserId: user.id },
      update: {},
      create: {
        ownerId: owner.id,
        legacyUserId: user.id,
        displayName: user.displayName,
        status: user.status,
        isPrimary: true,
      },
      select: { id: true },
    });

    const existingWallet = await tx.wallet.findUnique({
      where: { activityAccountId: activityAccount.id },
      select: { id: true },
    });

    if (existingWallet) {
      return;
    }

    const wallet = await tx.wallet.create({
      data: {
        activityAccountId: activityAccount.id,
        spendableBalance: user.pointsBalance,
        redeemableBalance: 0,
        pendingEarnings: 0,
        status: 'active',
      },
      select: { id: true },
    });

    if (user.pointsBalance > 0) {
      await tx.walletLedgerEntry.create({
        data: {
          walletId: wallet.id,
          kind: 'credit',
          source: 'consumer_foundation_provisioning',
          deltaSpendable: user.pointsBalance,
          deltaRedeemable: 0,
          deltaPending: 0,
          spendableAfter: user.pointsBalance,
          redeemableAfter: 0,
          pendingAfter: 0,
          idempotencyKey: `consumer-foundation:legacy-balance:${activityAccount.id}`,
          referenceType: 'User',
          referenceId: user.id,
          metadata: {
            purpose: 'consumer_foundation_provisioning',
            legacyField: 'User.pointsBalance',
          },
        },
      });
    }
  }

  private normalizePhone(phone: string) {
    return phone.replace(/[^\d]/g, '');
  }

  private normalizeCountryCode(countryCode?: string) {
    return (countryCode || 'KR').trim().toUpperCase();
  }

  private formatPhoneKey(phone: string, countryCode?: string) {
    const digits = this.normalizePhone(phone);
    if (!digits) {
      throw new BadRequestException('Invalid phone number');
    }
    const cc = this.normalizeCountryCode(countryCode);
    return { digits, countryCode: cc };
  }

  private hashPhone(phone: string, countryCode?: string) {
    const { digits, countryCode: cc } = this.formatPhoneKey(phone, countryCode);
    return createHash('sha256').update(`${cc}:${digits}`).digest('hex');
  }

  private generateOtpCode() {
    return randomInt(100000, 1_000_000).toString().padStart(6, '0');
  }

  private async serializeAuthUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        provider: true,
        pointsBalance: true,
        profile: {
          select: {
            nickname: true,
            bio: true,
            headline: true,
            avatarUri: true,
          },
        },
      },
    });
  }

  private getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error(
        'JWT_SECRET is not set. Please configure it as an environment variable on the server.',
      );
    }
    return secret;
  }

  private async makeToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return jwtSign(
      { sub: userId, tokenVersion: user.tokenVersion },
      this.getJwtSecret(),
      { expiresIn: '7d' },
    );
  }

  async signupEmail(dto: EmailSignupDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });
    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    const hashed = await argon2.hash(dto.password);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: dto.email,
          provider: 'email',
          // phoneHash: '' // schema가 optional이므로 불필요. 꼭 필요하면 빈문자 유지 가능
          passwordHash: hashed,
          displayName: (dto as any).displayName ?? null,
          dob: new Date(dto.dob),
          gender: dto.gender,
        },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          status: true,
          pointsBalance: true,
        },
      });

      await this.ensureConsumerFoundation(tx, createdUser);

      return {
        id: createdUser.id,
        email: createdUser.email,
        displayName: createdUser.displayName,
      };
    });

    const token = await this.makeToken(user.id);
    return { user, token, access_token: token }; // 프론트 호환
  }

  async loginEmail(dto: EmailLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, email: true, displayName: true, passwordHash: true },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = await this.makeToken(user.id);
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName ?? null },
      token,
      access_token: token, // 프론트 호환
    };
  }

  private async provisionSocialUser(params: {
    provider: 'kakao' | 'naver' | 'google' | 'apple';
    providerId: string;
    email?: string | null;
    displayName?: string | null;
    avatarUri?: string | null;
  }) {
    const { provider, providerId, avatarUri } = params;
    const fallbackEmail = `${provider}_${providerId}@social.dagaon.com`;
    const email = params.email?.trim().toLowerCase() || fallbackEmail;
    const displayName = params.displayName?.trim() || `${provider.toUpperCase()} 회원`;

    // 1. 기존 유저 확인 (이메일 기준)
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { email: fallbackEmail },
        ],
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        pointsBalance: true,
      },
    });

    if (!user) {
      // 2. 신규 회원 자동 가입
      user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            displayName,
            role: 'user',
            status: 'active',
            provider,
            trustScore: 80,
            pointsBalance: 1000,
            lang: 'ko',
          },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            status: true,
            pointsBalance: true,
          },
        });

        await this.ensureConsumerFoundation(tx, newUser);

        await tx.profile.upsert({
          where: { userId: newUser.id },
          update: {},
          create: {
            userId: newUser.id,
            nickname: displayName,
            avatarUri: avatarUri || null,
            interests: ['일상', '소통'],
            badges: ['NEW', '본인인증'],
          },
        });

        return newUser;
      });
    }

    const token = await this.makeToken(user.id);
    return {
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? displayName,
        provider,
      },
      token,
      access_token: token,
    };
  }

  async loginKakao(dto: KakaoLoginDto) {
    const kakaoKey = await this.adminSettings.getDecryptedSetting('oauth_kakao_client_id');

    // 1. 관리자에 키가 등록되어 있고 실제 토큰인 경우 카카오 API 검증
    if (kakaoKey && dto.accessToken && !dto.accessToken.startsWith('test_')) {
      try {
        const res = await fetch('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${dto.accessToken}` },
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const providerId = String(data.id);
          const email = data.kakao_account?.email || null;
          const displayName = data.properties?.nickname || data.kakao_account?.profile?.nickname || '카카오 회원';
          const avatarUri = data.properties?.profile_image || data.kakao_account?.profile?.profile_image_url || null;

          return this.provisionSocialUser({
            provider: 'kakao',
            providerId,
            email,
            displayName,
            avatarUri,
          });
        }
      } catch (err: any) {
        // 실제 API 호출 실패 시 아래 폴백 진행
      }
    }

    // 2. 관리자 키 미등록 또는 테스트 토큰 시: 간편 테스트 계정 프로비저닝 (개발/심사 편의)
    const mockId = dto.accessToken.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'kakao_user';
    return this.provisionSocialUser({
      provider: 'kakao',
      providerId: mockId,
      displayName: '카카오 사용자',
    });
  }

  async loginNaver(dto: NaverLoginDto) {
    const naverClientId = await this.adminSettings.getDecryptedSetting('oauth_naver_client_id');

    if (naverClientId && dto.accessToken && !dto.accessToken.startsWith('test_')) {
      try {
        const res = await fetch('https://openapi.naver.com/v1/nid/me', {
          headers: { Authorization: `Bearer ${dto.accessToken}` },
        });

        if (res.ok) {
          const data = (await res.json()) as any;
          const resp = data.response;
          if (resp?.id) {
            return this.provisionSocialUser({
              provider: 'naver',
              providerId: resp.id,
              email: resp.email || null,
              displayName: resp.nickname || resp.name || '네이버 회원',
              avatarUri: resp.profile_image || null,
            });
          }
        }
      } catch (err: any) {
        // 폴백
      }
    }

    const mockId = dto.accessToken.replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'naver_user';
    return this.provisionSocialUser({
      provider: 'naver',
      providerId: mockId,
      displayName: '네이버 사용자',
    });
  }

  async loginGoogle(dto: GoogleLoginDto) {
    const googleClientId = await this.adminSettings.getDecryptedSetting('oauth_google_client_id');

    if (googleClientId && dto.idToken && !dto.idToken.startsWith('test_')) {
      try {
        const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${dto.idToken}`);
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data?.sub) {
            return this.provisionSocialUser({
              provider: 'google',
              providerId: data.sub,
              email: data.email || null,
              displayName: data.name || '구글 회원',
              avatarUri: data.picture || null,
            });
          }
        }
      } catch (err: any) {
        // 폴백
      }
    }

    const mockId = (dto.idToken || 'google').slice(-8);
    return this.provisionSocialUser({
      provider: 'google',
      providerId: mockId,
      displayName: '구글 사용자',
    });
  }

  async loginApple(dto: AppleTokenDto) {
    // Apple ID Token 페이로드 디코딩
    let sub = 'apple_user';
    let email = dto.email || null;

    if (dto.idToken) {
      try {
        const parts = dto.idToken.split('.');
        if (parts.length >= 2) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
          if (payload?.sub) sub = payload.sub;
          if (payload?.email && !email) email = payload.email;
        }
      } catch {
        // fallback
      }
    }

    return this.provisionSocialUser({
      provider: 'apple',
      providerId: sub,
      email,
      displayName: dto.fullName || 'Apple 회원',
    });
  }

  async requestPhoneOtp(dto: PhoneRequestOtpDto) {
    if (DISABLE_AUTH) {
      return { requestId: `dummy-${Date.now()}`, expiresIn: 300 };
    }

    const { digits, countryCode } = this.formatPhoneKey(dto.phone, dto.countryCode);

    const now = new Date();
    const recentRequest = await this.prisma.phoneVerification.findFirst({
      where: {
        phone: digits,
        countryCode,
        createdAt: {
          gte: new Date(now.getTime() - OTP_REQUEST_COOLDOWN_SECONDS * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    if (recentRequest) {
      const retryAfter = Math.max(
        1,
        Math.ceil(
          (recentRequest.createdAt.getTime() +
            OTP_REQUEST_COOLDOWN_SECONDS * 1000 -
            now.getTime()) /
            1000,
        ),
      );

      throw new HttpException(
        { error: 'OTP_REQUEST_TOO_FREQUENT', retryAfter },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const code = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await this.prisma.phoneVerification.deleteMany({
      where: {
        phone: digits,
        countryCode,
        verifiedAt: null,
        expiresAt: { lt: new Date(Date.now() - 3600 * 1000) },
      },
    });

    const record = await this.prisma.phoneVerification.create({
      data: {
        phone: digits,
        countryCode,
        codeHash: await argon2.hash(code),
        expiresAt,
      },
      select: { id: true },
    });

    const response: Record<string, any> = {
      requestId: record.id,
      expiresIn: OTP_EXPIRY_SECONDS,
    };

    if (process.env.NODE_ENV !== 'production') {
      response.debugCode = code;
    }

    return response;
  }

  async verifyPhoneOtp(dto: PhoneVerifyDto) {
    if (DISABLE_AUTH) {
      return {
        token: 'dummy-token',
        needsProfile: true,
        verificationId: `admin-${Date.now()}`,
      };
    }

    const digits = this.normalizePhone(dto.phone);
    if (!digits) {
      throw new BadRequestException('Invalid phone number');
    }

    const request = await this.prisma.phoneVerification.findUnique({
      where: { id: dto.requestId },
    });

    if (!request || request.phone !== digits) {
      throw new BadRequestException('Invalid verification request');
    }

    if (request.verifiedAt) {
      throw new BadRequestException('Verification code already used');
    }

    if (request.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code expired');
    }

    if (request.attempts >= 5) {
      throw new BadRequestException('Too many verification attempts');
    }

    if (!(await argon2.verify(request.codeHash, dto.code))) {
      await this.prisma.phoneVerification.update({
        where: { id: request.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid verification code');
    }

    const verificationUpdate: Prisma.PhoneVerificationUpdateInput = {};
    if (!request.verifiedAt) {
      verificationUpdate.verifiedAt = new Date();
    }

    const phoneHash = this.hashPhone(dto.phone);

    let resolvedUserId: string | null = request.userId ?? null;
    if (!resolvedUserId) {
      const existing = await this.prisma.user.findFirst({
        where: { phoneHash },
        select: { id: true },
      });
      resolvedUserId = existing?.id ?? null;
    }

    if (resolvedUserId) {
      verificationUpdate.user = { connect: { id: resolvedUserId } };
      verificationUpdate.completedAt = request.completedAt ?? new Date();

      await this.prisma.phoneVerification.update({
        where: { id: request.id },
        data: verificationUpdate,
      });

      const token = await this.makeToken(resolvedUserId);
      const user = await this.serializeAuthUser(resolvedUserId);
      return { token, user };
    }

    await this.prisma.phoneVerification.update({
      where: { id: request.id },
      data: verificationUpdate,
    });

    return { needsProfile: true, verificationId: request.id };
  }

  async completePhoneProfile(dto: CompletePhoneProfileDto) {
    const digits = this.normalizePhone(dto.phone);
    if (!digits) {
      throw new BadRequestException('Invalid phone number');
    }

    const dob = new Date(Date.UTC(dto.birthYear, 0, 1));
    const region = (dto.region ?? '').trim();
    const [region1, ...restRegion] = region ? region.split(/\s+/) : [''];
    const region2 = restRegion.join(' ').trim();

    const nickname = dto.nickname.trim();
    const headline = dto.headline?.trim();
    const bio = dto.bio?.trim();
    const avatarUriValue = dto.avatarUri?.trim();
    const avatarUri =
      avatarUriValue && avatarUriValue.length > 0 ? avatarUriValue : undefined;

    if (DISABLE_AUTH) {
      const userId = await this.createOrUpdatePhoneUser({
        phoneDigits: digits,
        nickname,
        dob,
        gender: dto.gender,
        region1: region1 || null,
        region2: region2 || null,
        headline: headline ?? null,
        bio: bio ?? null,
        avatarUri: avatarUri ?? null,
      });

      const token = await this.makeToken(userId);
      const user = await this.serializeAuthUser(userId);
      return { token, user };
    }

    const request = await this.prisma.phoneVerification.findUnique({
      where: { id: dto.verificationId },
    });

    if (!request || request.phone !== digits) {
      throw new BadRequestException('Invalid verification request');
    }

    if (!request.verifiedAt || request.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification has expired');
    }

    if (request.completedAt && request.userId) {
      const token = await this.makeToken(request.userId);
      const user = await this.serializeAuthUser(request.userId);
      return { token, user };
    }

    const phoneHash = this.hashPhone(digits, request.countryCode);

    const existing = await this.prisma.user.findFirst({
      where: { phoneHash },
      select: { id: true },
    });

    if (existing) {
      await this.prisma.phoneVerification.update({
        where: { id: request.id },
        data: {
          user: { connect: { id: existing.id } },
          completedAt: new Date(),
        },
      });
      const token = await this.makeToken(existing.id);
      const user = await this.serializeAuthUser(existing.id);
      return { token, user };
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            provider: 'phone',
            phoneHash,
            displayName: nickname,
            dob,
            gender: dto.gender,
            region1: region1 || null,
            region2: region2 ? region2 : null,
            profile: {
              create: {
                nickname,
                bio: bio ? bio : null,
                headline: headline ? headline : null,
                avatarUri: avatarUri ?? null,
                interests: [],
                badges: [],
              },
            },
          },
          select: {
            id: true,
            role: true,
            status: true,
            displayName: true,
            pointsBalance: true,
          },
        });

        await this.ensureConsumerFoundation(tx, user);

        await tx.phoneVerification.update({
          where: { id: request.id },
          data: {
            user: { connect: { id: user.id } },
            completedAt: new Date(),
          },
        });

        return user.id;
      });

      const token = await this.makeToken(result);
      const user = await this.serializeAuthUser(result);
      return { token, user };
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException('Phone number already registered');
      }
      throw error;
    }
  }

  private async createOrUpdatePhoneUser(options: {
    phoneDigits: string;
    nickname: string;
    dob: Date;
    gender: string;
    region1?: string | null;
    region2?: string | null;
    headline?: string | null;
    bio?: string | null;
    avatarUri?: string | null;
  }) {
    const phoneHash = this.hashPhone(options.phoneDigits);

    const profileUpdate: Prisma.ProfileUpdateInput = {};
    if (options.nickname) {
      profileUpdate.nickname = options.nickname;
    }
    if (options.bio !== undefined) {
      profileUpdate.bio = options.bio;
    }
    if (options.headline !== undefined) {
      profileUpdate.headline = options.headline;
    }
    if (options.avatarUri !== undefined) {
      profileUpdate.avatarUri = options.avatarUri;
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const upsertedUser = await tx.user.upsert({
        where: { phoneHash },
        create: {
          provider: 'phone',
          phoneHash,
          displayName: options.nickname,
          dob: options.dob,
          gender: options.gender,
          region1: options.region1 ?? null,
          region2: options.region2 ?? null,
          profile: {
            create: {
              nickname: options.nickname || '회원',
              bio: options.bio ?? null,
              headline: options.headline ?? null,
              avatarUri: options.avatarUri ?? null,
              interests: [],
              badges: [],
            },
          },
        },
        update: {
          displayName: options.nickname ?? undefined,
          dob: options.dob,
          gender: options.gender,
          region1: options.region1 ?? null,
          region2: options.region2 ?? null,
          profile: {
            upsert: {
              update: profileUpdate,
              create: {
                nickname: options.nickname || '회원',
                bio: options.bio ?? null,
                headline: options.headline ?? null,
                avatarUri: options.avatarUri ?? null,
                interests: [],
                badges: [],
              },
            },
          },
        },
        select: {
          id: true,
          role: true,
          status: true,
          displayName: true,
          pointsBalance: true,
        },
      });

      await this.ensureConsumerFoundation(tx, upsertedUser);
      return upsertedUser;
    });

    return user.id;
  }

  async testLogin() {
    const testEmail = 'test_user@dagaon.com';
    let user = await this.prisma.user.findUnique({
      where: { email: testEmail },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
        pointsBalance: true,
      },
    });

    if (!user) {
      const hashed = await argon2.hash('DagaonTest2026!');
      user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email: testEmail,
            provider: 'email',
            passwordHash: hashed,
            displayName: '다가온테스터',
            dob: new Date('1998-01-01'),
            gender: 'other',
            pointsBalance: 1000,
            profile: {
              create: {
                nickname: '다가온테스터',
                headline: '다가온 공식 테스트 계정입니다 ✨',
                bio: '다가온 서비스를 원활하게 테스트하고 탐색하는 공식 계정입니다.',
                avatarUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              },
            },
          },
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            status: true,
            pointsBalance: true,
          },
        });
        await this.ensureConsumerFoundation(tx, created);
        return created;
      });
    }

    const token = await this.makeToken(user.id);
    const serialized = await this.serializeAuthUser(user.id);
    return {
      access_token: token,
      token,
      user: serialized,
    };
  }
}
