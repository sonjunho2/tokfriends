import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  CreateAdminTeamMemberDto,
  SaveAdminAuditMemoDto,
  UpdateAdminFeatureFlagDto,
  UpdateAdminIntegrationSettingDto,
  UpdateAdminTeamMemberDto,
  UpdateAdminTeamMemberPasswordDto,
} from './dto';
import { PrismaService } from 'nestjs-prisma';
import { encryptAdminSettingValue } from './admin-settings.crypto';

const adminProfileArgs = Prisma.validator<Prisma.AdminProfileDefaultArgs>()({
  include: {
    user: {
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        status: true,
      },
    },
  },
});

type AdminProfileRecord = Prisma.AdminProfileGetPayload<typeof adminProfileArgs>;

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private toTeamMember(profile: AdminProfileRecord) {
    return {
      id: profile.userId,
      email: profile.user.email ?? undefined,
      username: profile.user.email ?? undefined,
      name: profile.user.displayName ?? undefined,
      role: profile.role,
      status: profile.status,
      twoFactor: profile.twoFactorEnabled,
      permissions: [...profile.permissions],
      lastLoginAt: profile.lastLoginAt?.toISOString(),
    };
  }

  private async requireSettingsActor(actorId: string) {
    const actor = await this.prisma.user.findUnique({
      where: { id: actorId },
      select: {
        id: true,
        role: true,
        status: true,
        adminProfile: {
          select: {
            role: true,
            status: true,
            permissions: true,
          },
        },
      },
    });

    if (!actor || actor.role !== 'admin' || actor.status !== 'active') {
      throw new ForbiddenException('Active admin account required');
    }

    if (!actor.adminProfile || actor.adminProfile.status !== 'ACTIVE') {
      throw new ForbiddenException('Active admin profile required');
    }

    if (
      actor.adminProfile.role !== 'SUPER_ADMIN' &&
      !actor.adminProfile.permissions.includes('settings.manage')
    ) {
      throw new ForbiddenException('Settings permission required');
    }

    return actor.adminProfile;
  }

  async createTeamMember(actorId: string, dto: CreateAdminTeamMemberDto) {
    const actorProfile = await this.requireSettingsActor(actorId);

    if (dto.role === 'SUPER_ADMIN' && actorProfile.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can create another super admin');
    }

    const email = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const userStatus = dto.status === 'SUSPENDED' ? 'suspended' : 'active';

    const profile = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          provider: 'email',
          role: 'admin',
          status: userStatus,
          displayName: dto.name.trim(),
        },
      });

      const createdProfile = await tx.adminProfile.create({
        data: {
          userId: user.id,
          role: dto.role ?? 'MANAGER',
          status: dto.status ?? 'ACTIVE',
          permissions: dto.permissions ?? [],
          twoFactorEnabled: dto.twoFactor ?? false,
        },
        include: adminProfileArgs.include,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `admin:${user.id}`,
          action: 'ADMIN_TEAM_MEMBER_CREATED',
          notes: `role=${createdProfile.role};status=${createdProfile.status}`,
        },
      });

      return createdProfile;
    });

    return this.toTeamMember(profile);
  }
  async updateTeamMember(
    actorId: string,
    memberId: string,
    dto: UpdateAdminTeamMemberDto,
  ) {
    const actorProfile = await this.requireSettingsActor(actorId);

    const target = await this.prisma.adminProfile.findUnique({
      where: { userId: memberId },
      include: adminProfileArgs.include,
    });

    if (!target) {
      throw new NotFoundException('Admin team member not found');
    }

    if (target.role === 'SUPER_ADMIN' && actorProfile.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can modify a super admin');
    }

    if (dto.role === 'SUPER_ADMIN' && actorProfile.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can promote another super admin');
    }

    const nextRole = dto.role ?? target.role;
    const nextStatus = dto.status ?? target.status;

    if (
      target.role === 'SUPER_ADMIN' &&
      target.status === 'ACTIVE' &&
      (nextRole !== 'SUPER_ADMIN' || nextStatus !== 'ACTIVE')
    ) {
      const activeSuperAdmins = await this.prisma.adminProfile.count({
        where: {
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException('At least one active super admin is required');
      }
    }

    let normalizedEmail: string | undefined;

    if (dto.email !== undefined) {
      normalizedEmail = dto.email.trim().toLowerCase();

      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: { id: true },
      });

      if (existingUser && existingUser.id !== memberId) {
        throw new ConflictException('An account with this email already exists');
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: memberId },
        data: {
          role: 'admin',
          ...(normalizedEmail !== undefined ? { email: normalizedEmail } : {}),
          ...(dto.name !== undefined ? { displayName: dto.name.trim() } : {}),
          ...(dto.status !== undefined
            ? { status: dto.status === 'SUSPENDED' ? 'suspended' : 'active' }
            : {}),
        },
      });

      const profile = await tx.adminProfile.update({
        where: { userId: memberId },
        data: {
          ...(dto.role !== undefined ? { role: dto.role } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.permissions !== undefined ? { permissions: dto.permissions } : {}),
          ...(dto.twoFactor !== undefined ? { twoFactorEnabled: dto.twoFactor } : {}),
        },
        include: adminProfileArgs.include,
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `admin:${memberId}`,
          action: 'ADMIN_TEAM_MEMBER_UPDATED',
          notes: `role=${profile.role};status=${profile.status}`,
        },
      });

      return profile;
    });

    return this.toTeamMember(updated);
  }
  async updateTeamMemberPassword(
    actorId: string,
    memberId: string,
    dto: UpdateAdminTeamMemberPasswordDto,
  ) {
    const actorProfile = await this.requireSettingsActor(actorId);

    const target = await this.prisma.adminProfile.findUnique({
      where: { userId: memberId },
      include: adminProfileArgs.include,
    });

    if (!target) {
      throw new NotFoundException('Admin team member not found');
    }

    if (target.role === 'SUPER_ADMIN' && actorProfile.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can change a super admin password');
    }

    const passwordHash = await argon2.hash(dto.password);

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: memberId },
        data: { passwordHash },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `admin:${memberId}`,
          action: 'ADMIN_TEAM_MEMBER_PASSWORD_CHANGED',
        },
      });

      return tx.adminProfile.findUniqueOrThrow({
        where: { userId: memberId },
        include: adminProfileArgs.include,
      });
    });

    return this.toTeamMember(updated);
  }
  async deleteTeamMember(actorId: string, memberId: string) {
    const actorProfile = await this.requireSettingsActor(actorId);

    if (actorId === memberId) {
      throw new ForbiddenException('You cannot remove your own admin account');
    }

    const target = await this.prisma.adminProfile.findUnique({
      where: { userId: memberId },
      include: adminProfileArgs.include,
    });

    if (!target) {
      throw new NotFoundException('Admin team member not found');
    }

    if (target.role === 'SUPER_ADMIN' && actorProfile.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only a super admin can remove a super admin');
    }

    if (target.role === 'SUPER_ADMIN' && target.status === 'ACTIVE') {
      const activeSuperAdmins = await this.prisma.adminProfile.count({
        where: {
          role: 'SUPER_ADMIN',
          status: 'ACTIVE',
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new ForbiddenException('At least one active super admin is required');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.adminProfile.delete({
        where: { userId: memberId },
      });

      await tx.user.update({
        where: { id: memberId },
        data: {
          role: 'user',
          status: 'suspended',
          passwordHash: null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          target: `admin:${memberId}`,
          action: 'ADMIN_TEAM_MEMBER_REMOVED',
          notes: `previousRole=${target.role}`,
        },
      });
    });

    return { success: true };
  }
  async updateFeatureFlag(
    actorId: string,
    flagId: string,
    dto: UpdateAdminFeatureFlagDto,
  ) {
    await this.requireSettingsActor(actorId);

    const existing = await this.prisma.adminFeatureFlag.findUnique({
      where: { id: flagId },
    });

    if (!existing) {
      throw new NotFoundException('Admin feature flag not found');
    }

    const updated = await this.prisma.adminFeatureFlag.update({
      where: { id: flagId },
      data: { enabled: dto.enabled },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `admin-feature-flag:${flagId}`,
        action: 'ADMIN_FEATURE_FLAG_UPDATED',
        notes: `enabled=${updated.enabled}`,
      },
    });

    return updated;
  }

  async updateIntegrationSetting(
    actorId: string,
    settingId: string,
    dto: UpdateAdminIntegrationSettingDto,
  ) {
    await this.requireSettingsActor(actorId);

    const existing = await this.prisma.adminIntegrationSetting.findUnique({
      where: { id: settingId },
    });

    if (!existing) {
      throw new NotFoundException('Admin integration setting not found');
    }

    const value = dto.value;
    const maskedValue = '********';

    let encryptedValue = existing.encryptedValue;

    if (value === '') {
      encryptedValue = null;
    } else if (value !== maskedValue) {
      encryptedValue = encryptAdminSettingValue(value);
    }

    const updated = await this.prisma.adminIntegrationSetting.update({
      where: { id: settingId },
      data: { encryptedValue },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: `admin-integration:${settingId}`,
        action: 'ADMIN_INTEGRATION_SETTING_UPDATED',
        notes: `configured=${Boolean(updated.encryptedValue)}`,
      },
    });

    return {
      id: updated.id,
      label: updated.label,
      placeholder: updated.placeholder ?? undefined,
      value: updated.encryptedValue ? maskedValue : '',
    };
  }

  async saveAuditMemo(actorId: string, dto: SaveAdminAuditMemoDto) {
    await this.requireSettingsActor(actorId);

    const state = await this.prisma.adminSettingsState.upsert({
      where: { id: 'default' },
      update: { auditMemo: dto.memo },
      create: {
        id: 'default',
        auditMemo: dto.memo,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        target: 'admin-settings:audit-memo',
        action: 'ADMIN_AUDIT_MEMO_UPDATED',
      },
    });

    return { memo: state.auditMemo };
  }
  async getSnapshot(actorId: string) {
    await this.requireSettingsActor(actorId);

    const [profiles, featureFlags, integrations, settingsState] =
      await Promise.all([
        this.prisma.adminProfile.findMany({
          include: adminProfileArgs.include,
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.adminFeatureFlag.findMany({
          orderBy: { name: 'asc' },
        }),
        this.prisma.adminIntegrationSetting.findMany({
          orderBy: { label: 'asc' },
        }),
        this.prisma.adminSettingsState.findUnique({
          where: { id: 'default' },
        }),
      ]);

    const maskedValue = '********';

    return {
      members: profiles.map((profile) => this.toTeamMember(profile)),
      featureFlags,
      integrations: integrations.map((setting) => ({
        id: setting.id,
        label: setting.label,
        placeholder: setting.placeholder ?? undefined,
        value: setting.encryptedValue ? maskedValue : '',
      })),
      auditMemo: settingsState?.auditMemo ?? '',
    };
  }
}
