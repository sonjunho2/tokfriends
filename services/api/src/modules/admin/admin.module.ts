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

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [
    AdminController,
    SystemSettingsController,
    AdminApprovalsController,
    AdvertisementsController,
  ],
  providers: [AdminSettingsService, SettlementService, AdsRewardsService, PrismaService],
  exports: [AdminSettingsService, SettlementService, AdsRewardsService],
})
export class AdminModule {}
