// services/api/src/modules/users/admin-users.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'nestjs-prisma';
import { UsersService } from './users.service';

type AdminUserNoteDto = { note: string; authorId?: string };
type AdminUserActionDto = { reason?: string; performedBy?: string; metadata?: Record<string, any> };
type ProfileVisibilitySettings = {
  marketingOptIn?: boolean;
  verified?: boolean;
  subscriptionPlan?: string;
  [key: string]: unknown;
};

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'kim' })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'riskLevel', required: false, type: String, example: 'high' })
  @ApiQuery({ name: 'segment', required: false, type: String })
  @ApiQuery({ name: 'joinedFrom', required: false, type: String })
  @ApiQuery({ name: 'joinedTo', required: false, type: String })
  @ApiQuery({ name: 'sort', required: false, type: String, example: 'lastActivity' })
  async list(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('segment') segment?: string,
    @Query('joinedFrom') joinedFrom?: string,
    @Query('joinedTo') joinedTo?: string,
    @Query('sort') sort?: string,
  ) {
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (p - 1) * take;

    const where: Prisma.UserWhereInput = {};

    if (search?.trim()) {
      where.OR = [
        { email: { contains: search.trim(), mode: Prisma.QueryMode.insensitive } },
        { displayName: { contains: search.trim(), mode: Prisma.QueryMode.insensitive } },
        {
          profile: {
            nickname: { contains: search.trim(), mode: Prisma.QueryMode.insensitive },
          },
        },
      ];
    }

    if (status?.trim()) {
      where.status = status.trim().toLowerCase();
    }

    const riskFilter = this.resolveRiskFilter(riskLevel);
    if (riskFilter) {
      where.trustScore = riskFilter;
    }

    if (segment?.trim()) {
      where.profile = { badges: { has: segment.trim() } };
    }

    if (joinedFrom || joinedTo) {
      where.createdAt = {
        gte: joinedFrom ? new Date(joinedFrom) : undefined,
        lte: joinedTo ? new Date(joinedTo) : undefined,
      };
    }

    const orderBy = this.resolveOrder(sort);

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          email: true,
          displayName: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          trustScore: true,
          provider: true,
          region1: true,
          region2: true,
          profile: {
            select: { nickname: true, badges: true, interests: true, visibility: true },
          },
          _count: {
            select: {
              reportsToMe: true,
              posts: true,
              messages: true,
            },
          },
        },
      }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      nickname: row.profile?.nickname ?? row.displayName ?? null,
      status: row.status,
      provider: row.provider,
      createdAt: row.createdAt,
      lastActiveAt: row.updatedAt,
      riskLevel: this.resolveRiskLevel(row.trustScore),
      reportsCount: row._count.reportsToMe ?? 0,
      postsCount: row._count.posts ?? 0,
      segments: row.profile?.badges ?? [],
    }));

    return {
      ok: true,
      page: p,
      limit: take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
      data,
      items: data,
    };
  }

  @Get('search')
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiQuery({ name: 'phone', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  async searchUsers(
    @Query('keyword') keyword?: string,
    @Query('phone') phone?: string,
    @Query('status') status?: string,
  ) {
    const users = await this.usersService.searchUsers({ keyword, phone, status });
    return { ok: true, data: users, items: users };
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        displayName: true,
        status: true,
        provider: true,
        createdAt: true,
        updatedAt: true,
        region1: true,
        region2: true,
        trustScore: true,
        lang: true,
        profile: {
          select: {
            nickname: true,
            bio: true,
            interests: true,
            badges: true,
            visibility: true,
          },
        },
        _count: {
          select: { posts: true, messages: true, reportsToMe: true },
        },
        posts: { select: { id: true }, take: 5 },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const [notes, actions, reports] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { target: `user:${id}`, action: 'USER_NOTE' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, actorId: true, notes: true, createdAt: true },
      }),
      this.prisma.auditLog.findMany({
        where: { target: `user:${id}`, action: { startsWith: 'USER_ACTION:' } },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, actorId: true, action: true, notes: true, createdAt: true },
      }),
      this.prisma.report.findMany({
        where: { reportedId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, reason: true, status: true, createdAt: true },
      }),
    ]);

    const visibility = (user.profile?.visibility as Record<string, any> | undefined) ?? {};

    return {
      ok: true,
      data: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        provider: user.provider,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        region1: user.region1,
        region2: user.region2,
        lang: user.lang,
        trustScore: user.trustScore,
        riskLevel: this.resolveRiskLevel(user.trustScore),
        segments: user.profile?.badges ?? [],
        aiTags: user.profile?.interests ?? [],
        marketing: {
          optIn: visibility?.marketingOptIn ?? false,
          subscriptionPlan: visibility?.subscriptionPlan ?? null,
          verified: visibility?.verified ?? false,
        },
        profile: user.profile
          ? {
              nickname: user.profile.nickname,
              bio: user.profile.bio,
              interests: user.profile.interests ?? [],
            }
          : null,
        counters: {
          posts: user._count.posts ?? 0,
          messages: user._count.messages ?? 0,
          reports: user._count.reportsToMe ?? 0,
        },
        reports,
        notes: notes.map((note) => ({
          id: note.id,
          authorId: note.actorId,
          note: note.notes,
          createdAt: note.createdAt,
        })),
        actionLog: actions.map((action) => ({
          id: action.id,
          authorId: action.actorId,
          action: action.action.replace('USER_ACTION:', ''),
          createdAt: action.createdAt,
          metadata: this.tryParseJson(action.notes),
        })),
      },
    };
  }

  @Patch(':id')
  async updateProfile(@Param('id') id: string, @Body() body: Record<string, any>) {
    await this.ensureUserExists(id);

    const existingProfile = await this.prisma.profile.findUnique({
      where: { userId: id },
      select: { nickname: true, bio: true, badges: true, interests: true, visibility: true },
    });

    const profileVisibility: ProfileVisibilitySettings =
      existingProfile?.visibility &&
      typeof existingProfile.visibility === 'object' &&
      !Array.isArray(existingProfile.visibility)
        ? { ...(existingProfile.visibility as Record<string, unknown>) }
        : {};

    const marketingOptIn = this.normalizeBoolean(body.marketingOptIn);
    const verified = this.normalizeBoolean(body.verified);
    const subscriptionPlan = typeof body.subscriptionPlan === 'string' ? body.subscriptionPlan.trim() : undefined;

    if (marketingOptIn !== undefined) {
      profileVisibility.marketingOptIn = marketingOptIn;
    }
    if (verified !== undefined) {
      profileVisibility.verified = verified;
    }
    if (subscriptionPlan !== undefined && subscriptionPlan.length > 0) {
      profileVisibility.subscriptionPlan = subscriptionPlan;
    }

    const profileUpdate: Prisma.ProfileUpdateInput = {};
    let nextNickname: string | undefined;
    let nextBio: string | null | undefined;
    let nextInterests: string[] | undefined;
    let nextBadges: string[] | undefined;
    
    if (body.nickname !== undefined || body.displayName !== undefined) {
      nextNickname =
        (typeof body.nickname === 'string' ? body.nickname.trim() : undefined) ??
        (typeof body.displayName === 'string' ? body.displayName.trim() : undefined) ??
        existingProfile?.nickname ??
        '회원';
          profileUpdate.nickname = nextNickname;
    }

    if (body.bio !== undefined) {
      nextBio = typeof body.bio === 'string' ? body.bio.trim() : null;
      profileUpdate.bio = nextBio;
    }

    if (body.interests !== undefined) {
      nextInterests = Array.isArray(body.interests)
        ? body.interests.map((tag: any) => String(tag).trim()).filter((tag) => tag.length > 0)
        : existingProfile?.interests ?? [];
          profileUpdate.interests = nextInterests;
    }

    if (body.badges !== undefined) {
      nextBadges = Array.isArray(body.badges)
        ? body.badges.map((badge: any) => String(badge).trim()).filter((badge) => badge.length > 0)
        : existingProfile?.badges ?? [];
          profileUpdate.badges = nextBadges;
    }

    if (
      marketingOptIn !== undefined ||
      verified !== undefined ||
      subscriptionPlan !== undefined
    ) {
      profileUpdate.visibility = profileVisibility as Prisma.InputJsonValue;
    }

    const userUpdate: Prisma.UserUpdateInput = {};

    if (typeof body.displayName === 'string') {
      userUpdate.displayName = body.displayName.trim();
    }
    if (typeof body.region1 === 'string') {
      userUpdate.region1 = body.region1.trim();
    }
    if (typeof body.region2 === 'string') {
      userUpdate.region2 = body.region2.trim();
    }
    if (typeof body.lang === 'string') {
      userUpdate.lang = body.lang.trim();
    }

    if (body.status !== undefined) {
      const normalized = String(body.status).trim().toLowerCase();
      if (normalized) {
        userUpdate.status = normalized;
      }
    }

    const trustScore = this.resolveRiskScore(body.riskLevel);
    if (trustScore !== undefined) {
      userUpdate.trustScore = trustScore;
    }

    if (Object.keys(profileUpdate).length > 0) {
      userUpdate.profile = {
        upsert: {
          update: profileUpdate,
          create: {
            nickname:
              nextNickname ??
              existingProfile?.nickname ??
              (typeof body.displayName === 'string' ? body.displayName.trim() : undefined) ??
              '회원',
            bio: nextBio ?? existingProfile?.bio ?? null,
            interests: nextInterests ?? existingProfile?.interests ?? [],
            badges: nextBadges ?? existingProfile?.badges ?? [],
            visibility: Object.keys(profileVisibility).length
              ? (profileVisibility as Prisma.InputJsonValue)
              : undefined,
          },
        },
      };
    }

    await this.prisma.user.update({
      where: { id },
      data: userUpdate,
      include: {
        profile: true,
        _count: { select: { posts: true, messages: true, reportsToMe: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        target: `user:${id}`,
        action: 'USER_ACTION:PROFILE_UPDATE',
        notes: JSON.stringify({ updated: Object.keys(body ?? {}) }),
      },
    });

    const detail = await this.detail(id);
    return detail;
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: { status: string; expiresAt?: string }) {
    await this.ensureUserExists(id);
    const next = String(body?.status || '').toLowerCase();
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: next },
      select: { id: true, email: true, status: true },
    });

    await this.prisma.auditLog.create({
      data: {
        target: `user:${id}`,
        action: 'USER_ACTION:STATUS_CHANGE',
        notes: JSON.stringify({ status: next, expiresAt: body?.expiresAt ?? null }),
      },
    });

    return { ok: true, data: updated };
  }

  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() body: AdminUserNoteDto) {
    await this.ensureUserExists(id);
    const noteText = body?.note?.trim();
    if (!noteText) {
      throw new BadRequestException('note is required');
    }

    const entry = await this.prisma.auditLog.create({
      data: {
        actorId: body?.authorId ?? null,
        target: `user:${id}`,
        action: 'USER_NOTE',
        notes: noteText,
      },
      select: { id: true, actorId: true, notes: true, createdAt: true },
    });

    return {
      ok: true,
      data: {
        id: entry.id,
        authorId: entry.actorId,
        note: entry.notes,
        createdAt: entry.createdAt,
      },
    };
  }

  @Post(':id/actions/resend-verification')
  async resendVerification(@Param('id') id: string, @Body() body: AdminUserActionDto) {
    await this.ensureUserExists(id);
    const entry = await this.logAction(id, 'RESEND_VERIFICATION', body);
    return { ok: true, data: entry };
  }

  @Post(':id/actions/password-reset')
  async triggerPasswordReset(@Param('id') id: string, @Body() body: AdminUserActionDto) {
    await this.ensureUserExists(id);
    const entry = await this.logAction(id, 'PASSWORD_RESET', body);
    return { ok: true, data: entry };
  }

  @Post(':id/actions/escalate')
  async escalate(@Param('id') id: string, @Body() body: AdminUserActionDto) {
    await this.ensureUserExists(id);
    const entry = await this.logAction(id, 'ESCALATE', body);
    return { ok: true, data: entry };
  }

  private resolveRiskFilter(level?: string): Prisma.IntFilter | undefined {
    if (!level) return undefined;
    switch (level.toLowerCase()) {
      case 'low':
        return { gte: 70 };
      case 'medium':
        return { gte: 40, lt: 70 };
      case 'high':
        return { lt: 40 };
      default:
        return undefined;
    }
  }

  private resolveRiskLevel(score: number | null | undefined) {
    if (typeof score !== 'number') return 'unknown';
    if (score >= 70) return 'low';
    if (score >= 40) return 'medium';
    return 'high';
  }

  private resolveRiskScore(level?: string) {
    if (!level) return undefined;
    switch (level.toLowerCase()) {
      case 'low':
        return 80;
      case 'medium':
        return 55;
      case 'high':
        return 25;
      default:
        return undefined;
    }
  }

  private resolveOrder(sort?: string): Prisma.UserOrderByWithRelationInput[] {
    if (!sort) {
      return [{ createdAt: 'desc' }];
    }
    switch (sort) {
      case 'lastActivity':
        return [{ updatedAt: 'desc' }];
      case 'reportCount':
      case 'reports':
        return [{ reportsToMe: { _count: 'desc' } }, { createdAt: 'desc' }];
      case 'joinedAsc':
        return [{ createdAt: 'asc' }];
      default:
        return [{ createdAt: 'desc' }];
    }
  }

  private normalizeBoolean(value: any) {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'y'].includes(value.toLowerCase());
    }
    return undefined;
  }

  private async ensureUserExists(id: string) {
    const exists = await this.prisma.user.count({ where: { id } });
    if (!exists) {
      throw new NotFoundException('User not found');
    }
  }

  private async logAction(userId: string, action: string, body: AdminUserActionDto) {
    const payload = {
      reason: body?.reason ?? null,
      performedBy: body?.performedBy ?? null,
      metadata: body?.metadata ?? null,
    };

    const entry = await this.prisma.auditLog.create({
      data: {
        actorId: body?.performedBy ?? null,
        target: `user:${userId}`,
        action: `USER_ACTION:${action}`,
        notes: JSON.stringify(payload),
      },
      select: { id: true, action: true, notes: true, createdAt: true, actorId: true },
    });

    return {
      id: entry.id,
      action: entry.action.replace('USER_ACTION:', ''),
      createdAt: entry.createdAt,
      actorId: entry.actorId,
      metadata: this.tryParseJson(entry.notes),
    };
  }

  private tryParseJson(raw?: string | null) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return { message: raw };
    }
  }
}
