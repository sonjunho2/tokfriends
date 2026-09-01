// services/api/src/modules/community/community.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
 controllers: [CommunityController],
 providers: [CommunityService, PrismaService],
 exports: [CommunityService],
})
export class CommunityModule {}