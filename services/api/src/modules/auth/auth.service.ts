import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
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
  PhoneRequestOtpDto,
  PhoneVerifyDto,
  CompletePhoneProfileDto,
} from './dto';

const OTP_EXPIRY_SECONDS = 180;
const DISABLE_AUTH = process.env.DISABLE_AUTH_AND_PAYMENT === 'true';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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

  private makeToken(payload: any) {
    return jwtSign(payload, this.getJwtSecret(), { expiresIn: '7d' });
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

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        provider: 'email',
        // phoneHash: '' // schema가 optional이므로 불필요. 꼭 필요하면 빈문자 유지 가능
        passwordHash: hashed,
        displayName: (dto as any).displayName ?? null,
        dob: new Date(dto.dob),
        gender: dto.gender,
      },
      select: { id: true, email: true, displayName: true },
    });

    const token = this.makeToken({ sub: user.id });
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

    const token = this.makeToken({ sub: user.id });
    return {
      user: { id: user.id, email: user.email, displayName: user.displayName ?? null },
      token,
      access_token: token, // 프론트 호환
    };
  }

  async loginApple(_dto: AppleTokenDto) {
    throw new BadRequestException('Apple login not implemented yet');
  }

  async requestPhoneOtp(dto: PhoneRequestOtpDto) {
    if (DISABLE_AUTH) {
      return { requestId: `dummy-${Date.now()}`, expiresIn: 300 };
    }

    const { digits, countryCode } = this.formatPhoneKey(dto.phone, dto.countryCode);

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
        adminOverride: true,
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

      const token = this.makeToken({ sub: resolvedUserId });
      const user = await this.serializeAuthUser(resolvedUserId);
      return { token, user };
    }

    await this.prisma.phoneVerification.update({
      where: { id: request.id },
      data: verificationUpdate,
    });

    return { needsProfile: true, verificationId: request.id };
  }

  async completePhoneProfile(
    dto: CompletePhoneProfileDto,
    adminOverride = false,
  ) {
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

    if (DISABLE_AUTH || adminOverride) {
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

      const token = this.makeToken({ sub: userId });
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
      const token = this.makeToken({ sub: request.userId });
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
      const token = this.makeToken({ sub: existing.id });
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
          select: { id: true },
        });

        await tx.phoneVerification.update({
          where: { id: request.id },
          data: {
            user: { connect: { id: user.id } },
            completedAt: new Date(),
          },
        });

        return user.id;
      });

      const token = this.makeToken({ sub: result });
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

    const user = await this.prisma.user.upsert({
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
      select: { id: true },
    });

    return user.id;
  }
}
