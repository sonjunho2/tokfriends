import { Module, forwardRef } from '@nestjs/common';
import { SystemSettingsController } from './system-settings.controller';
import { PrismaService } from 'nestjs-prisma';
import { CallsModule } from '../calls/calls.module';

import { AdminController } from './admin.controller';
import { AdminSettingsService } from './admin-settings.service';

@Module({
  imports: [forwardRef(() => CallsModule)],
  controllers: [AdminController, SystemSettingsController],
  providers: [AdminSettingsService, PrismaService],
  exports: [AdminSettingsService],
})
export class AdminModule {}
