// services/api/src/modules/live/live.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { LiveController } from './live.controller';
import { LiveService } from './live.service';

@Module({
  controllers: [LiveController],
  providers: [LiveService, PrismaService],
  exports: [LiveService],
})
export class LiveModule {}
