import { OnModuleDestroy, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { AuthenticatedUserContextService } from '../auth/authenticated-user-context.service';
import { Public } from '../auth/public.decorator';

@Public()
@SkipThrottle({ default: true })
@WebSocketGateway({
  cors: { origin: '*' },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly jwtSecret: string;

  constructor(
    private readonly authenticatedUserContext: AuthenticatedUserContextService,
  ) {
    this.jwtSecret = process.env.JWT_SECRET || 'tokfriends_secret_key_2026';
  }

  afterInit() {
    this.logger.log('Chat & Call WebSocket Gateway initialized');
  }

  async handleConnection(socket: Socket) {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string) ||
        socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (token) {
        const decoded = jwt.verify(token, this.jwtSecret) as any;
        const user = await this.authenticatedUserContext.resolveFromPayload(decoded);
        if (user) {
          socket.data.user = user;
          socket.join(`user_${user.id}`);
          this.logger.log(`User connected to WS: ${user.nickname} (${user.id})`);
        }
      }
    } catch (err) {
      // Allow anonymous connection for public live viewing
    }
  }

  handleDisconnect(socket: Socket) {
    const user = socket.data?.user;
    if (user) {
      this.logger.log(`User disconnected from WS: ${user.nickname}`);
    }
  }

  onModuleDestroy() {
    // cleanup
  }

  /**
   * 통화 또는 방송 방 입장
   */
  @SubscribeMessage('joinChannel')
  handleJoinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (data?.channelId) {
      socket.join(data.channelId);
      this.logger.log(`Socket ${socket.id} joined channel: ${data.channelId}`);
      return { ok: true, channelId: data.channelId };
    }
  }

  /**
   * 통화 또는 방송 방 퇴장
   */
  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { channelId: string },
  ) {
    if (data?.channelId) {
      socket.leave(data.channelId);
      return { ok: true };
    }
  }

  /**
   * 실시간 선물 발송 이벤트 중계
   */
  @SubscribeMessage('sendGift')
  handleSendGift(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    data: {
      channelId: string;
      giftName: string;
      points: number;
      effectTier: 1 | 2 | 3;
    },
  ) {
    const user = socket.data?.user;
    const payload = {
      id: `gift_${Date.now()}`,
      senderName: user?.nickname || '익명',
      giftName: data.giftName,
      points: data.points,
      effectTier: data.effectTier,
      createdAt: new Date().toISOString(),
    };

    if (data.channelId) {
      this.server.to(data.channelId).emit('GIFT_OVERLAY_TRIGGER', payload);
    }

    return { ok: true, data: payload };
  }
}
