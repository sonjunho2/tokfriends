import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from 'nestjs-prisma';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

export const ADMIN_PERMISSION_KEYS = [
  'users.manage',
  'reports.view',
  'content.manage',
  'refunds.view',
  'refunds.manage',
  'approvals.view',
  'approvals.manage',
  'settings.manage',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSION_KEYS)[number];

export const AdminPermissions = (...permissions: AdminPermission[]) =>
  SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<AdminPermission[]>(
        ADMIN_PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

    const request = context.switchToHttp().getRequest();
    const path = String(
      request?.originalUrl ?? request?.url ?? request?.path ?? '',
    ).split('?')[0];

    const isAdminPath = /(^|\/)admin(\/|$)/.test(path);

    if (!isAdminPath && requiredPermissions === undefined) {
      return true;
    }

    const user = request?.user;

    if (
      !user?.id ||
      user.role !== 'admin' ||
      user.status !== 'active'
    ) {
      throw new ForbiddenException('Active admin account required');
    }

    const profile = await this.prisma.adminProfile.findUnique({
      where: { userId: user.id },
      select: {
        userId: true,
        role: true,
        status: true,
        permissions: true,
        twoFactorEnabled: true,
      },
    });

    if (!profile || profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Active admin profile required');
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      throw new ForbiddenException(
        'Explicit admin permission is required for this action',
      );
    }

    if (profile.role === 'SUPER_ADMIN') {
      return true;
    }

    const hasAllPermissions = requiredPermissions.every((permission) =>
      profile.permissions.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException('Admin permission required');
    }

    return true;
  }
}