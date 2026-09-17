import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatsModule } from '../chats/chats.module';
import { ChatGateway } from './chat.gateway';

@Module({ imports: [AuthModule, ChatsModule], providers: [ChatGateway] })
export class WsModule {}
