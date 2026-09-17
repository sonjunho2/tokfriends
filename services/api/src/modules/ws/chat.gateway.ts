import { OnModuleDestroy } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayInit, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { isCorsOriginAllowed, parseCorsOrigins } from '../../common/cors-origins';
import { AuthenticatedUserContextService } from '../auth/authenticated-user-context.service';
import { ChatRealtimePublisher } from '../chats/chat-realtime-publisher.service';
import { ChatsService } from '../chats/chats.service';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = parseCorsOrigins(
        process.env.CORS_ORIGIN?.trim(),
      );

      if (!origin || isCorsOriginAllowed(origin, allowedOrigins)) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`), false);
    },
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayInit, OnModuleDestroy {
  @WebSocketServer() server: Server;
  private readonly jwtSecret: string;
  private unsubscribeRealtime?: () => void;

  constructor(
    private readonly authenticatedUserContext: AuthenticatedUserContextService,
    private readonly chatsService: ChatsService,
    private readonly chatRealtimePublisher: ChatRealtimePublisher,
  ) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is required');
    }
    this.jwtSecret = jwtSecret;
  }

  afterInit(server: Server) {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = this.chatRealtimePublisher.subscribe((message) => {
      server.to(`chat:${message.chatId}`).emit('chat:message', message);
    });
  }

  onModuleDestroy(): void {
    this.unsubscribeRealtime?.();
    this.unsubscribeRealtime = undefined;
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (typeof token !== 'string' || !token.trim()) {
        client.disconnect(true);
        return;
      }
      const payload = jwt.verify(token, this.jwtSecret);
      const context =
        await this.authenticatedUserContext.resolveFromPayload(payload);
      if (!context) {
        client.disconnect(true);
        return;
      }
      client.data.userId = context.id;
      client.data.activityAccountId = context.activityAccountId;
      client.emit('connected', { ok: true });
    } catch (e) {
      client.disconnect(true);
    }
  }

  @SubscribeMessage('chat:join')
  async join(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const userId = client.data.userId;
    const chatId = typeof data?.chatId === 'string' ? data.chatId.trim() : '';
    if (typeof userId !== 'string' || !userId.trim() || !chatId) {
      return { ok: false, error: 'CHAT_UNAVAILABLE' };
    }
    try {
      const authorized = await this.chatsService.authorizeRealtimeRoom(
        userId,
        client.data.activityAccountId,
        chatId,
      );
      client.join(`chat:${authorized.chatId}`);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'CHAT_UNAVAILABLE' };
    }
  }

  @SubscribeMessage('chat:leave')
  async leave(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string }) {
    const userId = client.data.userId;
    const chatId = typeof data?.chatId === 'string' ? data.chatId.trim() : '';
    if (typeof userId !== 'string' || !userId.trim() || !chatId) {
      return { ok: false, error: 'CHAT_UNAVAILABLE' };
    }
    await client.leave(`chat:${chatId}`);
    return { ok: true };
  }

  @SubscribeMessage('chat:typing')
  async typing(@ConnectedSocket() client: Socket, @MessageBody() data: { chatId: string, typing: boolean }) {
    const userId = client.data.userId;
    const chatId = typeof data?.chatId === 'string' ? data.chatId.trim() : '';
    if (typeof userId !== 'string' || !userId.trim() || !chatId || typeof data?.typing !== 'boolean') {
      return { ok: false, error: 'CHAT_UNAVAILABLE' };
    }
    try {
      const authorized = await this.chatsService.authorizeRealtimeRoom(
        userId,
        client.data.activityAccountId,
        chatId,
      );
      this.server.to(`chat:${authorized.chatId}`).emit('chat:typing', {
        chatId: authorized.chatId,
        senderAccountId: client.data.activityAccountId,
        typing: data.typing,
      });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: 'CHAT_UNAVAILABLE' };
    }
  }

}
