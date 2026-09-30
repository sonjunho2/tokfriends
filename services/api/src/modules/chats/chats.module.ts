import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaService } from 'nestjs-prisma';
import { ChatRealtimePublisher } from './chat-realtime-publisher.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { GiftsModule } from '../gifts/gifts.module';

@Module({
  imports: [NotificationsModule, GiftsModule],
  providers: [ChatsService, PrismaService, ChatRealtimePublisher],
  controllers: [ChatsController],
  exports: [ChatsService, ChatRealtimePublisher],
})
export class ChatsModule {}
