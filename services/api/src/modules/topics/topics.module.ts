// services/api/src/modules/topics/topics.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { TopicsController } from './topics.controller';
import { TopicsService } from './topics.service';

@Module({
 controllers: [TopicsController],
 providers: [TopicsService, PrismaService],
 exports: [TopicsService],
})
export class TopicsModule {}