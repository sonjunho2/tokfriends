import { Module } from '@nestjs/common';
import { PrismaModule } from 'nestjs-prisma';
import { FriendshipsService } from './friendships.service';
import { FriendshipsController } from './friendships.controller';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [PrismaModule, AdminModule],
  providers: [FriendshipsService],
  controllers: [FriendshipsController],
})
export class FriendshipsModule {}
