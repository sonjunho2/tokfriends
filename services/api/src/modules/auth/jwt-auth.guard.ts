import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

type JwtPayload = {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authHeader: string | undefined =
      (req.headers['authorization'] as string | undefined) ??
      (req.headers['Authorization'] as string | undefined);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token');
    }

    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      // 서버 환경변수에 JWT_SECRET이 없으면 인증할 수 없음
      throw new UnauthorizedException('Server JWT secret not configured');
    }

    try {
      const payload = jwt.verify(token, secret) as JwtPayload;
      // 이후 핸들러에서 @CurrentUser()로 꺼내 쓸 수 있도록 요청 객체에 저장
      req.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
