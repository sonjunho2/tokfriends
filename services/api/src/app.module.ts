import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from 'nestjs-prisma';
import { APP_GUARD } from '@nestjs/core';

import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CallsModule } from './modules/calls/calls.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { AiStaffModule } from './modules/ai-staff/ai-staff.module';
import { AdminModule } from './modules/admin/admin.module';
import { WsModule } from './modules/ws/ws.module';
import { JwtAuthGuard } from './modules/auth/jwt.guard';
import { AdminPermissionsGuard } from './common/admin-permissions.guard';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    UsersModule,
    CallsModule,
    StreamingModule,
    AiStaffModule,
    AdminModule,
    WsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: AdminPermissionsGuard },
  ],
})
export class AppModule {}
