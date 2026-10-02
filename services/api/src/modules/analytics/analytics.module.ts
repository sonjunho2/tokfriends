// services/api/src/modules/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { AnalyticsController } from './analytics.controller';

@Module({
  providers: [PrismaService],
  controllers: [AnalyticsController],
  exports: [],
})
export class AnalyticsModule {}
