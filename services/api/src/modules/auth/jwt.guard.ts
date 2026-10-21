// services/api/src/modules/auth/jwt.guard.ts
import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 1) Swagger 문서(/docs, /docs-json) 및 헬스체크는 항상 통과
    const req = context.switchToHttp().getRequest();
    const path: string = req?.path || req?.url || '';
    if (path.startsWith('/docs') || path.startsWith('/health')) return true;

    // 2) @Public() 데코레이터가 붙은 곳:
    if (isPublic) {
      const authHeader: string | undefined =
        req.headers['authorization'] || req.headers['Authorization'];
      if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        try {
          // 토큰이 존재하면 passport jwt 전략을 실행하여 req.user를 파싱 & 주입
          const result = await (super.canActivate(context) as Promise<boolean>);
          return result;
        } catch {
          // Public 라우트이므로 토큰 검증 실패 시 차단하지 않고 익명(게스트) 통과
          return true;
        }
      }
      return true;
    }

    // 3) 그 외는 기본적으로 JWT 필수
    return (await super.canActivate(context)) as boolean;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // isPublic인 경우 에러나 유저 부재 시에도 예외를 던지지 않고 user(있을 경우)를 반환
      return user || null;
    }

    if (err || !user) {
      throw err || new UnauthorizedException('Invalid token');
    }
    return user;
  }
}

