import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        process.env.NEXTAUTH_SECRET ||
        'fallback-dev-secret',
    });
  }

  // payload: { sub: userId, iat, exp }
  async validate(payload: any) {
    return { id: payload.sub };
  }
}
