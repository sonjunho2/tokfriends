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

  private readonly liveRoomViewers = new Map<string, Set<string>>();
  private readonly socketLiveRooms = new Map<string, string>();

  handleDisconnect(socket: Socket) {
    const user = socket.data?.user;
    if (user) {
      this.logger.log(`User disconnected from WS: ${user.nickname}`);
    }

    const roomId = this.socketLiveRooms.get(socket.id);
    if (roomId) {
      this.socketLiveRooms.delete(socket.id);
      const set = this.liveRoomViewers.get(roomId);
      if (set) {
        set.delete(socket.id);
        const count = Math.max(1, set.size);
        this.server.to(`live_room_${roomId}`).emit('live:viewer_count', { roomId, viewerCount: count });
      }
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

  /**
   * 라이브 방송 실시간 방 입장 및 시청자 추적
   */
  @SubscribeMessage('live:join')
  handleLiveJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; viewerKey?: string },
  ) {
    const roomId = data?.roomId;
    if (!roomId) return { ok: false };

    socket.join(`live_room_${roomId}`);
    this.socketLiveRooms.set(socket.id, roomId);

    let viewerSet = this.liveRoomViewers.get(roomId);
    if (!viewerSet) {
      viewerSet = new Set<string>();
      this.liveRoomViewers.set(roomId, viewerSet);
    }
    viewerSet.add(socket.id);

    const viewerCount = Math.max(1, viewerSet.size);
    this.server.to(`live_room_${roomId}`).emit('live:viewer_count', { roomId, viewerCount });
    this.logger.log(`Live Room ${roomId}: socket ${socket.id} joined (viewers: ${viewerCount})`);
    return { ok: true, roomId, viewerCount };
  }

  /**
   * 라이브 방송 실시간 방 퇴장
   */
  @SubscribeMessage('live:leave')
  handleLiveLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    const roomId = data?.roomId || this.socketLiveRooms.get(socket.id);
    if (!roomId) return { ok: false };

    socket.leave(`live_room_${roomId}`);
    this.socketLiveRooms.delete(socket.id);

    const viewerSet = this.liveRoomViewers.get(roomId);
    if (viewerSet) {
      viewerSet.delete(socket.id);
      const viewerCount = Math.max(1, viewerSet.size);
      this.server.to(`live_room_${roomId}`).emit('live:viewer_count', { roomId, viewerCount });
      this.logger.log(`Live Room ${roomId}: socket ${socket.id} left (viewers: ${viewerCount})`);
    }
    return { ok: true };
  }

  /**
   * 외부(컨트롤러)에서 방송 종료 이벤트 브로드캐스트
   */
  emitLiveRoomEnded(roomId: string, reason?: string) {
    const channel = `live_room_${roomId}`;
    this.server.to(channel).emit('live:ended', {
      roomId,
      reason: reason || '호스트가 라이브 방송을 종료했습니다.',
    });
    this.liveRoomViewers.delete(roomId);
    this.logger.log(`Live Room ${roomId} broadcast ended: notified all connected viewers`);
  }

  /**
   * 실시간 시청자 수 조회
   */
  getLiveRoomViewerCount(roomId: string): number {
    return Math.max(1, this.liveRoomViewers.get(roomId)?.size || 1);
  }

  /**
   * 외부(컨트롤러)에서 실시간 시청자 수 브로드캐스트
   */
  emitLiveViewerCount(roomId: string, count: number) {
    const channel = `live_room_${roomId}`;
    this.server.to(channel).emit('live:viewer_count', { roomId, viewerCount: count });
  }
}

