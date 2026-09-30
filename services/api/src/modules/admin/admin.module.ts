import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  controllers: [AdminController],
  providers: [AdminSettingsService],
})
export class AdminModule {}
