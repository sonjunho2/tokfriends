// services/api/src/guards/jwt-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verify } from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
 canActivate(context: ExecutionContext): boolean {
   const request = context.switchToHttp().getRequest();
   const authHeader = request.headers.authorization;

   if (!authHeader || !authHeader.startsWith('Bearer ')) {
     throw new UnauthorizedException('Missing or invalid authorization header');
   }

   const token = authHeader.substring(7);
   const secret = process.env.JWT_SECRET || 'dev_secret';

   try {
     const payload = verify(token, secret) as any;
     request.user = { id: payload.sub };
     return true;
   } catch (error) {
     throw new UnauthorizedException('Invalid token');
   }
 }
}
