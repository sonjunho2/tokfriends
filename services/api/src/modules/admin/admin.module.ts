import { Module, forwardRef } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { PrismaService } from 'nestjs-prisma';
import { CallsModule } from '../calls/calls.module';

import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { SettlementService } from './settlement.service';
import { AdminApprovalsController } from './admin-approvals.controller';

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [AdminController, SystemSettingsController, AdminApprovalsController],
  providers: [AdminSettingsService, SettlementService, PrismaService],
  exports: [AdminSettingsService, SettlementService],
})
export class AdminModule {}
