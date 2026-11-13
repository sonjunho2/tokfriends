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

      const directUserId =
        (socket.handshake.auth?.userId as string) ||
        (socket.handshake.query?.userId as string);

      if (directUserId) {
        socket.join(`user_${directUserId}`);
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, this.jwtSecret) as any;
          const uId = decoded?.sub || decoded?.id;
          if (uId) {
            socket.join(`user_${uId}`);
          }
          const user = await this.authenticatedUserContext.resolveFromPayload(decoded);
          if (user) {
            socket.data.user = user;
            socket.join(`user_${user.id}`);
            if (user.nickname) {
              socket.join(`user_${user.nickname}`);
            }
            this.logger.log(`User connected to WS: ${user.nickname} (${user.id})`);
          } else if (uId) {
            socket.data.user = { id: uId, nickname: decoded.nickname || '회원' };
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

  // roomId -> Map<viewerIdentity, Set<socketId>>
  private readonly liveRoomViewers = new Map<string, Map<string, Set<string>>>();
  // socketId -> { roomId: string; identity: string; isHost: boolean }
  private readonly socketLiveRooms = new Map<string, { roomId: string; identity: string; isHost: boolean }>();

  handleDisconnect(socket: Socket) {
    const user = socket.data?.user;
    if (user) {
      this.logger.log(`User disconnected from WS: ${user.nickname}`);
    }

    const session = this.socketLiveRooms.get(socket.id);
    if (session) {
      this.socketLiveRooms.delete(socket.id);
      const roomViewersMap = this.liveRoomViewers.get(session.roomId);
      if (roomViewersMap && !session.isHost) {
        const socketSet = roomViewersMap.get(session.identity);
        if (socketSet) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            roomViewersMap.delete(session.identity);
          }
        }
        const count = roomViewersMap.size;
        this.server.to(`live_room_${session.roomId}`).emit('live:viewer_count', { roomId: session.roomId, viewerCount: count });
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
    @MessageBody() data: { roomId: string; viewerKey?: string; nickname?: string; isHost?: boolean },
  ) {
    const roomId = data?.roomId;
    if (!roomId) return { ok: false };

    const isHost = Boolean(data?.isHost);
    const nickname = data?.nickname || (socket.data as any)?.user?.nickname || '모꼬이웃';
    const rawIdentity = (socket.data as any)?.user?.id
      ? `uid_${(socket.data as any).user.id}`
      : (data?.viewerKey || (nickname && nickname !== '모꼬이웃' ? `nick_${nickname}` : socket.id));
    const identity = String(rawIdentity).trim();

    socket.join(`live_room_${roomId}`);
    this.socketLiveRooms.set(socket.id, { roomId, identity, isHost });

    let roomViewersMap = this.liveRoomViewers.get(roomId);
    if (!roomViewersMap) {
      roomViewersMap = new Map<string, Set<string>>();
      this.liveRoomViewers.set(roomId, roomViewersMap);
    }

    // 💡 호스트(방송자)는 시청자(관객) 카운트에 포함하지 않음
    let isNewViewer = false;
    if (!isHost) {
      let socketSet = roomViewersMap.get(identity);
      if (!socketSet) {
        socketSet = new Set<string>();
        roomViewersMap.set(identity, socketSet);
        isNewViewer = true;
      }
      socketSet.add(socket.id);
    }

    const viewerCount = roomViewersMap.size;
    this.server.to(`live_room_${roomId}`).emit('live:viewer_count', { roomId, viewerCount });
    this.logger.log(`Live Room ${roomId}: socket ${socket.id} joined (isHost: ${isHost}, unique viewers: ${viewerCount})`);

    // 🎉 시청자 최초 입장 시에만 시스템 알림 및 입장 브로드캐스트 (다중소켓/새로고침 중복 방지)
    if (isNewViewer) {
      const enterMsg = {
        id: `sys-enter-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'SYSTEM',
        systemType: 'USER_JOIN',
        isJoin: true,
        sender: nickname,
        senderName: nickname,
        nickname,
        text: `✨ ${nickname}님이 입장했습니다.`,
        roomId,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now(),
      };
      this.server.to(`live_room_${roomId}`).emit('live:message', enterMsg);
      this.server.to(`live_room_${roomId}`).emit('live:user_joined', { roomId, nickname, viewerCount });
    }

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
    const session = this.socketLiveRooms.get(socket.id);
    const roomId = data?.roomId || session?.roomId;
    if (!roomId) return { ok: false };

    socket.leave(`live_room_${roomId}`);
    if (session) {
      this.socketLiveRooms.delete(socket.id);
      const roomViewersMap = this.liveRoomViewers.get(roomId);
      if (roomViewersMap && !session.isHost) {
        const socketSet = roomViewersMap.get(session.identity);
        if (socketSet) {
          socketSet.delete(socket.id);
          if (socketSet.size === 0) {
            roomViewersMap.delete(session.identity);
          }
        }
        const viewerCount = roomViewersMap.size;
        this.server.to(`live_room_${roomId}`).emit('live:viewer_count', { roomId, viewerCount });
        this.logger.log(`Live Room ${roomId}: socket ${socket.id} left (viewers: ${viewerCount})`);
      }
    }
    return { ok: true };
  }

  /**
   * 호스트가 클라이언트에서 직접 방송 종료 요청
   */
  @SubscribeMessage('live:end')
  handleLiveEnd(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { roomId: string; reason?: string },
  ) {
    const session = this.socketLiveRooms.get(socket.id);
    const roomId = data?.roomId || session?.roomId;
    if (!roomId) return { ok: false };
    this.emitLiveRoomEnded(roomId, data?.reason || '호스트가 라이브 방송을 종료했습니다.');
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

  // =========================================================================
  // 1:1 대화방 (Chat Rooms) 실시간 웹소켓 이벤트
  // =========================================================================

  /**
   * 1:1 대화방 입장 (소켓 룸 조인)
   */
  @SubscribeMessage('chat:join')
  handleChatJoin(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    if (data?.chatId) {
      const channel = `chat_room_${data.chatId}`;
      socket.join(channel);
      this.logger.log(`Socket ${socket.id} joined chat room: ${data.chatId}`);
      return { ok: true, chatId: data.chatId };
    }
    return { ok: false };
  }

  /**
   * 1:1 대화방 퇴장 (소켓 룸 퇴장)
   */
  @SubscribeMessage('chat:leave')
  handleChatLeave(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { chatId: string },
  ) {
    if (data?.chatId) {
      const channel = `chat_room_${data.chatId}`;
      socket.leave(channel);
      this.logger.log(`Socket ${socket.id} left chat room: ${data.chatId}`);
      return { ok: true, chatId: data.chatId };
    }
    return { ok: false };
  }

  /**
   * 실시간 타이핑 중 이벤트 전파
   */
  @SubscribeMessage('chat:typing')
  handleChatTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { chatId: string; typing: boolean },
  ) {
    if (data?.chatId) {
      const user = socket.data?.user;
      socket.to(`chat_room_${data.chatId}`).emit('chat:typing', {
        chatId: data.chatId,
        typing: Boolean(data.typing),
        senderAccountId: user?.id || 'unknown',
      });
    }
    return { ok: true };
  }

  /**
   * 메시지 읽음 처리 이벤트 전파
   */
  @SubscribeMessage('chat:read')
  handleChatRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { chatId: string; readerId?: string; readerAccountId?: string },
  ) {
    if (data?.chatId) {
      const user = socket.data?.user;
      const readerId = data?.readerId || data?.readerAccountId || user?.id || (user as any)?.nickname;
      const readAt = new Date().toISOString();
      socket.to(`chat_room_${data.chatId}`).emit('chat:read', {
        chatId: data.chatId,
        readerId,
        readerAccountId: readerId,
        readAt,
      });
    }
    return { ok: true };
  }

  /**
   * 클라이언트 연결 후 유저 ID / 닉네임 개인 알림 룸 바인딩
   */
  @SubscribeMessage('connected')
  handleConnected(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { userId?: string; nickname?: string },
  ) {
    if (data?.userId) {
      socket.join(`user_${data.userId}`);
      this.logger.log(`Socket ${socket.id} joined notification room: user_${data.userId}`);
    }
    if (data?.nickname) {
      socket.join(`user_${data.nickname}`);
      this.logger.log(`Socket ${socket.id} joined notification room: user_${data.nickname}`);
    }
    return { ok: true };
  }

  /**
   * 실시간 채팅 메시지 수신 및 중계
   */
  @SubscribeMessage('chat:message')
  handleChatMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: any,
  ) {
    const user = socket.data?.user;
    const userId = user?.id || data?.senderAccountId || 'guest';
    const chatId = data?.chatId;
    if (!chatId) return { ok: false };

    let senderName = data.senderNickname || data.senderName;
    if (!senderName || senderName === 'Super Admin' || senderName === 'admin') {
      const userNick = user?.nickname || user?.displayName;
      if (userNick && userNick !== 'Super Admin' && userNick !== 'admin') {
        senderName = userNick;
      } else {
        senderName = data.senderNickname || data.senderName || '테스터02';
      }
    }

    const payload = {
      ...data,
      senderAccountId: userId,
      senderName,
      senderAvatar: user?.avatarUrl || data.senderAvatar || null,
      createdAt: data.createdAt || new Date().toISOString(),
    };

    // 1) 대화방 내부 전체에 실시간 메시지 브로드캐스트
    this.server.to(`chat_room_${chatId}`).emit('chat:message', payload);

    // 2) 대화 상대방(외부 화면/목록/타 탭)에게 실시간 인앱 알림 & "모꼬" 사운드 트리거 브로드캐스트
    const targets = new Set<string>();
    if (data?.targetUserId && data.targetUserId !== userId) targets.add(data.targetUserId);
    if (data?.targetNickname && data.targetNickname !== senderName) targets.add(data.targetNickname);

    targets.forEach((target) => {
      this.server.to(`user_${target}`).emit('chat:incoming', {
        chatId,
        sender: {
          id: userId,
          nickname: payload.senderName,
          avatarUrl: payload.senderAvatar,
        },
        content: data.content,
        type: data.type || 'text',
        gift: data.type === 'gift' ? data.gift : undefined,
        createdAt: payload.createdAt,
      });
      // 대화방 밖에서도 실시간 메시지 동기화를 위해 chat:message도 함께 전파
      this.server.to(`user_${target}`).emit('chat:message', payload);
    });

    return { ok: true, data: payload };
  }

  // =========================================================================
  // 외부(서비스/컨트롤러) 호출용 브로드캐스트 메소드
  // =========================================================================

  /**
   * 대화방 메시지 브로드캐스트 및 수신자에게 팝업 알림("모꼬" 사운드) 전송
   */
  emitChatMessage(chatId: string, message: any, targetUserId?: string, participantIds?: string[]) {
    this.server.to(`chat_room_${chatId}`).emit('chat:message', message);

    const targets = new Set<string>();
    if (targetUserId) targets.add(targetUserId);
    if (participantIds && Array.isArray(participantIds)) {
      participantIds.forEach((id) => {
        if (id && id !== message.senderAccountId && id !== message.senderName) {
          targets.add(id);
        }
      });
    }

    const incomingPayload = {
      chatId,
      sender: {
        id: message.senderAccountId,
        nickname: message.senderName || '대화 상대',
        avatarUrl: message.senderAvatar || null,
      },
      content: message.content,
      type: message.type || 'text',
      createdAt: message.createdAt || new Date().toISOString(),
      gift: message.type === 'gift' ? {
        id: message.id,
        name: message.giftName || '선물',
        amount: message.giftPoints || 0,
        icon: message.giftIcon || '🎁',
      } : undefined,
    };

    targets.forEach((targetId) => {
      this.server.to(`user_${targetId}`).emit('chat:incoming', incomingPayload);
      this.server.to(`user_${targetId}`).emit('chat:message', message);
    });
  }

  /**
   * 상대방에게 1:1 대화방 인앱 알림 전파
   */
  emitIncomingChat(targetUserId: string, payload: any) {
    this.server.to(`user_${targetUserId}`).emit('chat:incoming', payload);
  }

  /**
   * 대화방 목록 업데이트 이벤트 (마지막 메시지 및 시간 실시간 동기화)
   */
  emitChatRoomUpdated(participantIds: string[], room: any) {
    participantIds.forEach((pid) => {
      this.server.to(`user_${pid}`).emit('chat:room_updated', room);
    });
  }

  /**
   * 신규 1줄 수다 토크 브로드캐스트 (전체 사용자 실시간 피드 반영)
   */
  emitSudaPost(post: any) {
    this.server.emit('suda:new_post', post);
    this.server.emit('SUDA_POST_CREATED', post);
    this.logger.log(`[WS Suda Broadcast] New Suda post: ${post.id}`);
  }

  /**
   * 1줄 수다 토크 삭제 브로드캐스트 (전체 사용자 실시간 피드 반영)
   */
  emitSudaDelete(postId: string) {
    this.server.emit('suda:delete_post', { postId, id: postId });
    this.server.emit('suda:deleted', { postId, id: postId });
    this.logger.log(`[WS Suda Broadcast] Deleted Suda post: ${postId}`);
  }
}

