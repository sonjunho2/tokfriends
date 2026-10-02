import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';
import { SettlementModule } from '../settlement/settlement.module';
import { MatchesAdminController } from './matches-admin.controller';
import { PrismaService } from 'nestjs-prisma';

@Module({
  imports: [SettlementModule],
  controllers: [AdminController, MatchesAdminController],
  providers: [AdminSettingsService, PrismaService],
  exports: [AdminSettingsService],
})
export class AdminModule {}
