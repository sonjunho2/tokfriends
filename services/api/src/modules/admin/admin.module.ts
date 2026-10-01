import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { SettlementModule } from '../settlement/settlement.module';

@Module({
  imports: [SettlementModule],
  controllers: [AdminController],
  providers: [AdminSettingsService],
  exports: [AdminSettingsService],
})
export class AdminModule {}
