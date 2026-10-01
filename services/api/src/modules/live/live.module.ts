// services/api/src/modules/live/live.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

import { GiftsModule } from '../gifts/gifts.module';
import { AdminModule } from '../admin/admin.module';
import { LiveRealtimePublisher } from './live-realtime-publisher.service';

@Module({
  imports: [GiftsModule, AdminModule],
  controllers: [LiveController],
  providers: [LiveService, PrismaService, LiveRealtimePublisher],
  exports: [LiveService, LiveRealtimePublisher],
})
export class LiveModule {}
