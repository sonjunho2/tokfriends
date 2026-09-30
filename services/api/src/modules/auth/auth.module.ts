import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from 'nestjs-prisma';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthenticatedUserContextService } from './authenticated-user-context.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy, AuthenticatedUserContextService],
  exports: [PassportModule, AuthService, AuthenticatedUserContextService],
})
export class AuthModule {}
