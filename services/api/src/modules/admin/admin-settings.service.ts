import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
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
import { encryptAdminSettingValue, decryptAdminSettingValue } from './admin-settings.crypto';

export interface DefaultIntegrationSettingDef {
  id: string;
  label: string;
  placeholder?: string;
}

export const DEFAULT_INTEGRATION_SETTINGS: DefaultIntegrationSettingDef[] = [
  // 1. 소셜 로그인 (OAuth)
  { id: 'oauth_kakao_client_id', label: '카카오 REST API 키', placeholder: '카카오 디벨로퍼스 앱 키 > REST API 키' },
  { id: 'oauth_kakao_client_secret', label: '카카오 Client Secret', placeholder: '카카오 로그인 > 보안 > Client Secret' },
  { id: 'oauth_naver_client_id', label: '네이버 Client ID', placeholder: '네이버 디벨로퍼스 애플리케이션 Client ID' },
  { id: 'oauth_naver_client_secret', label: '네이버 Client Secret', placeholder: '네이버 디벨로퍼스 Client Secret' },
  { id: 'oauth_google_client_id', label: '구글 OAuth Web Client ID', placeholder: 'Google Cloud Console OAuth 클라이언트 ID' },
  { id: 'oauth_google_client_secret', label: '구글 OAuth Client Secret', placeholder: 'Google Cloud Console 클라이언트 보안 비밀' },
  { id: 'oauth_apple_service_id', label: 'Apple Service ID (로그인 식별자)', placeholder: '예: com.sonjunho.ddakchin.signin' },
  { id: 'oauth_apple_team_id', label: 'Apple Team ID', placeholder: '10자리 Apple Developer Team ID' },
  { id: 'oauth_apple_key_id', label: 'Apple Key ID', placeholder: '10자리 Sign in with Apple Key ID' },
  { id: 'oauth_apple_private_key', label: 'Apple AuthKey (.p8 파일 내용)', placeholder: '-----BEGIN PRIVATE KEY----- ...' },

  // 2. 결제 및 PG 연동 (포인트 상점)
  { id: 'toss_payments_client_key', label: '토스페이먼츠 클라이언트 키', placeholder: 'live_ck_... 또는 test_ck_...' },
  { id: 'toss_payments_secret_key', label: '토스페이먼츠 시크릿 키', placeholder: 'live_sk_... 또는 test_sk_...' },
  { id: 'portone_store_id', label: '포트원(아임포트) Store ID (고객사 식별코드)', placeholder: '예: store-1234abcd-...' },
  { id: 'portone_api_key', label: '포트원 REST API Key', placeholder: '포트원 콘솔 V1/V2 API Key' },
  { id: 'portone_api_secret', label: '포트원 API Secret', placeholder: '포트원 콘솔 V1/V2 API Secret' },
  { id: 'iap_apple_shared_secret', label: 'Apple 인앱결제 Shared Secret', placeholder: 'App Store Connect 앱 전용 공유 암호' },
  { id: 'iap_google_service_account', label: 'Google 인앱결제 Service Account JSON', placeholder: 'Google Play Console 서비스 계정 키 JSON' },

  // 3. 실시간 푸시 알림 (Push Notifications)
  { id: 'firebase_project_id', label: 'Firebase 프로젝트 ID', placeholder: '예: dagaon-firebase-prod' },
  { id: 'firebase_service_account_json', label: 'Firebase 서비스 계정 비공개 키 JSON', placeholder: 'Firebase Console 서비스 계정 비공개 키 JSON 전체' },
  { id: 'apns_team_id', label: 'Apple APNs Team ID', placeholder: '10자리 Apple Developer Team ID' },
  { id: 'apns_key_id', label: 'Apple APNs Key ID', placeholder: '10자리 APNs 인증키 Key ID' },
  { id: 'apns_auth_key', label: 'Apple APNs AuthKey (.p8 파일 내용)', placeholder: '-----BEGIN PRIVATE KEY----- ...' },
  { id: 'apns_bundle_id', label: 'Apple APNs Bundle ID', placeholder: '예: com.sonjunho.ddakchin' },

  // 4. 라이브 스트리밍 (Agora RTC & CDN HLS 중계)
  { id: 'agora_app_id', label: 'Agora 라이브 App ID', placeholder: 'Agora 콘솔 > 프로젝트 관리 > App ID' },
  { id: 'agora_app_certificate', label: 'Agora 라이브 App Certificate (기본 인증서)', placeholder: 'Agora 콘솔 > 기본 인증서(Primary Certificate)' },
  { id: 'live_stream_mode', label: '라이브 스트리밍 송출 방식', placeholder: 'AGORA_RTC (초저지연 RTC) 또는 CDN_HLS (CDN 중계 HLS)' },
  { id: 'live_cdn_hls_url_pattern', label: 'CDN HLS 재생 URL 템플릿', placeholder: '예: https://live-cdn.dagaon.app/live/{roomId}/index.m3u8' },
  { id: 'live_cdn_rtmp_push_url', label: 'Agora Media Push RTMP 수신 주소', placeholder: '예: rtmp://live-push.dagaon.app/live/{roomId}' },
];

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
export class AdminSettingsService implements OnModuleInit {
  private readonly logger = new Logger(AdminSettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaultIntegrationSettings().catch((err) => {
      this.logger.warn(`Failed to seed default integration settings: ${err.message}`);
    });
  }

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
        data: { passwordHash, tokenVersion: { increment: 1 } },
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
          tokenVersion: { increment: 1 },
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
      encryptedValue = encryptAdminSettingValue(value, settingId);
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
  async ensureDefaultIntegrationSettings(): Promise<void> {
    try {
      const existingSettings = await this.prisma.adminIntegrationSetting.findMany({
        select: { id: true },
      });
      const existingIds = new Set(existingSettings.map((s) => s.id));

      const missing = DEFAULT_INTEGRATION_SETTINGS.filter((s) => !existingIds.has(s.id));
      if (missing.length > 0) {
        for (const item of missing) {
          await this.prisma.adminIntegrationSetting.create({
            data: {
              id: item.id,
              label: item.label,
              placeholder: item.placeholder,
            },
          });
        }
        this.logger.log(`Initialized ${missing.length} missing default integration settings.`);
      }
    } catch (err: any) {
      this.logger.warn(`Could not ensure default integration settings: ${err.message}`);
    }
  }

  async getDecryptedSetting(settingId: string): Promise<string | null> {
    try {
      const setting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: settingId },
      });
      if (!setting?.encryptedValue) {
        return null;
      }
      return decryptAdminSettingValue(setting.encryptedValue, settingId);
    } catch (e: any) {
      this.logger.warn(`Failed to decrypt setting ${settingId}: ${e?.message}`);
      return null;
    }
  }

  async getLiveStreamingConfig(): Promise<{
    mode: 'AGORA_RTC' | 'CDN_HLS';
    cdnHlsUrlPattern: string;
    cdnRtmpPushUrl: string;
  }> {
    const rawMode = await this.getDecryptedSetting('live_stream_mode');
    const mode = rawMode?.toUpperCase() === 'CDN_HLS' ? 'CDN_HLS' : 'AGORA_RTC';
    const cdnHlsUrlPattern =
      (await this.getDecryptedSetting('live_cdn_hls_url_pattern')) ||
      'https://live-cdn.dagaon.app/live/{roomId}/index.m3u8';
    const cdnRtmpPushUrl =
      (await this.getDecryptedSetting('live_cdn_rtmp_push_url')) ||
      'rtmp://live-push.dagaon.app/live/{roomId}';
    return {
      mode,
      cdnHlsUrlPattern,
      cdnRtmpPushUrl,
    };
  }

  async setLiveStreamingConfig(
    actorId: string,
    config: {
      mode?: 'AGORA_RTC' | 'CDN_HLS';
      cdnHlsUrlPattern?: string;
      cdnRtmpPushUrl?: string;
    },
  ) {
    await this.requireSettingsActor(actorId);

    if (config.mode) {
      await this.updateIntegrationSetting(actorId, 'live_stream_mode', {
        value: config.mode,
      });
    }
    if (config.cdnHlsUrlPattern !== undefined) {
      await this.updateIntegrationSetting(actorId, 'live_cdn_hls_url_pattern', {
        value: config.cdnHlsUrlPattern,
      });
    }
    if (config.cdnRtmpPushUrl !== undefined) {
      await this.updateIntegrationSetting(actorId, 'live_cdn_rtmp_push_url', {
        value: config.cdnRtmpPushUrl,
      });
    }
    return this.getLiveStreamingConfig();
  }

  async getSnapshot(actorId: string) {
    await this.requireSettingsActor(actorId);

    // 누락된 기본 설정 항목이 있으면 자동 보충
    await this.ensureDefaultIntegrationSettings();

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
          orderBy: { id: 'asc' },
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
