import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatsModule } from '../chats/chats.module';
import { LiveModule } from '../live/live.module';
import { ChatGateway } from './chat.gateway';

@Module({ imports: [AuthModule, ChatsModule, LiveModule], providers: [ChatGateway] })
export class WsModule {}
