import { Module } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [StoreController],
  providers: [StoreService, PrismaService],
})
export class StoreModule {}
