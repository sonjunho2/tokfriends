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

    if (handlerRoles.length === 0) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
    const user = req?.user;

    if (!user?.role) {
      return false;
    }

    return handlerRoles.includes(user.role);
  }
}