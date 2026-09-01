import { Module } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { ChatsController } from './chats.controller';
import { PrismaService } from 'nestjs-prisma';

@Module({ providers: [ChatsService, PrismaService], controllers: [ChatsController] })
export class ChatsModule {}
