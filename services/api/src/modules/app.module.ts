// 수정 파일: services/api/src/modules/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'nestjs-prisma';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { ChatsModule } from './chats/chats.module';
import { ReportsModule } from './reports/reports.module';
import { MetricsModule } from './metrics/metrics.module';
import { StoreModule } from './store/store.module';
import { LegalDocumentsModule } from './legal-documents/legal-documents.module';
import { LegacyModule } from './legacy/legacy.module'; // 추가
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt.guard';
import { AliasModule } from './alias/alias.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule.forRoot({ isGlobal: true }),
    HealthModule,
    AuthModule,
    UsersModule,
    ChatsModule,
    ReportsModule,
    MetricsModule,
    StoreModule,
    LegalDocumentsModule,
    LegacyModule,
    AliasModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
