import { Module, forwardRef } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { PrismaService } from 'nestjs-prisma';
import { CallsModule } from '../calls/calls.module';

import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { SettlementService } from './settlement.service';
import { AdsRewardsService } from './ads-rewards.service';
import { AdminApprovalsController } from './admin-approvals.controller';
import { AdvertisementsController } from './advertisements.controller';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { ReportsService } from './reports.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { ApiManagerController } from './api-manager.controller';
import { ApiManagerService } from './api-manager.service';

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [
    AdminController,
    SystemSettingsController,
    AdminApprovalsController,
    AdvertisementsController,
    ContentController,
    NotificationsController,
    AnalyticsController,
    ApiManagerController,
  ],
  providers: [
    AdminSettingsService,
    SettlementService,
    AdsRewardsService,
    ContentService,
    ReportsService,
    NotificationsService,
    AnalyticsService,
    ApiManagerService,
    PrismaService,
  ],
  exports: [
    AdminSettingsService,
    SettlementService,
    AdsRewardsService,
    ContentService,
    ReportsService,
    NotificationsService,
    AnalyticsService,
    ApiManagerService,
  ],
})
export class AdminModule {}
