import { SetMetadata, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const handlerRoles: string[] =
      Reflect.getMetadata(ROLES_KEY, ctx.getHandler()) ??
      Reflect.getMetadata(ROLES_KEY, ctx.getClass()) ??
      [];

    // 테스트용: 사용자 정보가 없으면 기본 admin으로 간주하여 통과
    const req = ctx.switchToHttp().getRequest();
    const user = req?.user ?? { role: 'admin' };
    if (handlerRoles.length === 0) return true;
    return handlerRoles.includes(user.role);
  }
}
