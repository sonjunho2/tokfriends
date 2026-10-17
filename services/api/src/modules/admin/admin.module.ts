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

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [
    AdminController,
    SystemSettingsController,
    AdminApprovalsController,
    AdvertisementsController,
    ContentController,
  ],
  providers: [
    AdminSettingsService,
    SettlementService,
    AdsRewardsService,
    ContentService,
    PrismaService,
  ],
  exports: [
    AdminSettingsService,
    SettlementService,
    AdsRewardsService,
    ContentService,
  ],
})
export class AdminModule {}
