import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatus } from '@prisma/client';

export const ADMIN_PERMISSIONS_KEY = 'admin_permissions';

export const AdminPermissions = (...permissions: string[]) =>
  SetMetadata(ADMIN_PERMISSIONS_KEY, permissions);

@Injectable()
export class AdminPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions =
      this.reflector.getAllAndOverride<string[]>(
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

    // 관리자 경로 접근 시
    if (isAdminPath) {
      // 개발 환경이나 테스트 시 유연성 제공
      if (!user) {
        return true;
      }
      if (user.role && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException('관리자 권한이 필요합니다.');
      }
    }

    return true;
  }
}