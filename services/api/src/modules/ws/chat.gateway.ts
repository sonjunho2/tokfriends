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
        try {
          const decoded = jwt.verify(token, this.jwtSecret) as any;
          const user = await this.authenticatedUserContext.resolveFromPayload(decoded);
          if (user) {
            socket.data.user = user;
            socket.join(`user_${user.id}`);
            this.logger.log(`User connected to WS: ${user.nickname} (${user.id})`);
          }
        } catch {
          // Token invalid or dummy - treat as guest
        }
      }
      socket.emit('connected', { socketId: socket.id, ok: true });
    } catch (err) {
      socket.emit('connected', { socketId: socket.id, ok: true, isAnonymous: true });
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
      channelId?: string;
      roomId?: string;
      giftName: string;
      points: number;
      effectTier?: 1 | 2 | 3;
      giftId?: string;
      animationType?: string;
      animationUrl?: string;
      thumbnailUrl?: string;
    },
  ) {
    const user = socket.data?.user;
    const targetRoomId = data.roomId || data.channelId || this.socketLiveRooms.get(socket.id);
    const tier = data.effectTier || (data.points >= 30000 ? 3 : data.points >= 3000 ? 2 : 1);
    const payload = {
      id: `gift_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      roomId: targetRoomId,
      type: 'gift',
      senderName: user?.nickname || user?.displayName || '시청자',
      giftName: data.giftName || '선물',
      points: data.points,
      giftPoints: data.points,
      effectTier: tier,
      animationType: data.animationType,
      animationUrl: data.animationUrl,
      thumbnailUrl: data.thumbnailUrl,
      createdAt: new Date().toISOString(),
    };

    if (targetRoomId) {
      this.server.to(`live_room_${targetRoomId}`).emit('live:message', payload);
      this.server.to(`live_room_${targetRoomId}`).emit('live:gift', payload);
      this.server.to(`live_room_${targetRoomId}`).emit('GIFT_OVERLAY_TRIGGER', payload);
      if (data.channelId && data.channelId !== targetRoomId) {
        this.server.to(data.channelId).emit('GIFT_OVERLAY_TRIGGER', payload);
      }
      this.logger.log(`[WS Gift Broadcast] Room ${targetRoomId}: ${data.giftName} (${data.points} ON) to ALL viewers & host`);
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
   * 실시간 채팅/선물 메시지 수신 및 브로드캐스트
   */
  @SubscribeMessage('live:message')
  handleLiveMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    let roomId = data?.roomId;
    let message = data?.message;

    // 클라이언트가 메시지 객체를 직접 전송한 경우 (data 자체가 message인 경우 지원)
    if (!message && data?.id) {
      message = data;
      roomId = data.roomId || this.socketLiveRooms.get(socket.id);
    } else if (!roomId) {
      roomId = this.socketLiveRooms.get(socket.id);
    }

    if (roomId && message) {
      this.server.to(`live_room_${roomId}`).emit('live:message', message);
      if (message.type === 'gift') {
        this.server.to(`live_room_${roomId}`).emit('live:gift', message);
        this.server.to(`live_room_${roomId}`).emit('GIFT_OVERLAY_TRIGGER', message);
        this.logger.log(`[WS Live Gift Message Relay] Room ${roomId}: ${message.giftPoints} ON`);
      }
    }
    return { ok: true };
  }

  /**
   * 실시간 라이브 커머스 핀 상품 고정/해제 이벤트 수신 및 방 전체 브로드캐스트
   */
  @SubscribeMessage('live:pin_product')
  handleLivePinProduct(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    const roomId = data?.roomId || this.socketLiveRooms.get(socket.id);
    const product = data?.product;
    const isPinned = data?.isPinned !== undefined ? data.isPinned : true;

    if (roomId) {
      const channel = `live_room_${roomId}`;
      this.server.to(channel).emit('LIVE_PINNED_PRODUCT_UPDATE', {
        roomId,
        product,
        isPinned,
        timestamp: new Date().toISOString(),
      });
      this.server.to(channel).emit('live:pin_product', {
        roomId,
        product,
        isPinned,
      });
      this.logger.log(`[WS Live Commerce Pin] Room ${roomId}: product ${product?.id || 'none'}, pinned: ${isPinned}`);
    }
    return { ok: true };
  }

  /**
   * 외부(컨트롤러)에서 실시간 핀 상품 브로드캐스트
   */
  emitLivePinProduct(roomId: string, product: any, isPinned = true) {
    const channel = `live_room_${roomId}`;
    this.server.to(channel).emit('LIVE_PINNED_PRODUCT_UPDATE', {
      roomId,
      product,
      isPinned,
      timestamp: new Date().toISOString(),
    });
    this.server.to(channel).emit('live:pin_product', {
      roomId,
      product,
      isPinned,
    });
  }

  /**
   * 외부(컨트롤러)에서 실시간 에스크로 주문 성공(구매 축하) 브로드캐스트
   */
  emitLiveOrderSuccess(roomId: string, orderData: { buyerName: string; productTitle: string; amount: number }) {
    const channel = `live_room_${roomId}`;
    const celebrationMsg = {
      id: `order-celeb-${Date.now()}`,
      roomId,
      type: 'commerce_purchase',
      content: `🎉 ${orderData.buyerName}님이 '${orderData.productTitle}'을(를) 구매하셨습니다!`,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: { id: 'system_commerce', name: '안전결제 시스템' },
    };
    this.server.to(channel).emit('live:order_success', {
      roomId,
      ...orderData,
      message: celebrationMsg,
    });
    this.server.to(channel).emit('live:message', celebrationMsg);
    this.logger.log(`[WS Live Commerce Purchase] Room ${roomId}: ${orderData.buyerName} bought ${orderData.productTitle}`);
  }

  /**
   * 외부(컨트롤러)에서 실시간 메시지/선물 브로드캐스트 (방 안의 호스트 및 모든 시청자에게 전파)
   */
  emitLiveMessage(roomId: string, message: any) {
    const channel = `live_room_${roomId}`;
    this.server.to(channel).emit('live:message', message);
    if (message?.type === 'gift') {
      this.server.to(channel).emit('live:gift', message);
      this.server.to(channel).emit('GIFT_OVERLAY_TRIGGER', message);
      this.logger.log(`[Live Controller Broadcast] Gift sent to all in ${channel}`);
    }
  }

  /**
   * 외부(컨트롤러)에서 실시간 시청자 수 브로드캐스트
   */
  emitLiveViewerCount(roomId: string, count: number) {
    const channel = `live_room_${roomId}`;
    this.server.to(channel).emit('live:viewer_count', { roomId, viewerCount: count });
  }
}

