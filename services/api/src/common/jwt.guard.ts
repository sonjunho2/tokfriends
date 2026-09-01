import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class JwtGuard implements CanActivate {
  // 테스트용: 인증을 항상 통과시킵니다. (나중에 실제 JWT 검증으로 교체)
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}
