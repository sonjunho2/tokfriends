import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [CallsController],
  providers: [CallsService, PrismaService],
  exports: [CallsService],
})
export class CallsModule {}
