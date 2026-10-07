import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import {
  AgoraRole,
  buildAgoraToken,
  userIdToAgoraUid,
} from './agora-token.util';
import { GiftsService } from '../gifts/gifts.service';
import { CreateLiveRoomDto, SendLiveGiftDto, SendLiveMessageDto } from './dto';
import { AdminSettingsService } from '../admin/admin-settings.service';
import { LiveRealtimePublisher } from './live-realtime-publisher.service';

const HOST_INCLUDE = {
  host: {
    select: {
      id: true,
      displayName: true,
      region1: true,
      region2: true,
      profile: {
        select: {
          nickname: true,
          avatarUri: true,
          headline: true,
        },
      },
    },
  },
  hostAccount: {
    select: {
      id: true,
      handle: true,
      displayName: true,
    },
  },
};

function formatRoom(
  room: any,
  streamConfig?: {
    mode?: 'AGORA_RTC' | 'CDN_HLS';
    hlsPlaybackUrl?: string | null;
    rtmpPushUrl?: string | null;
  },
  entryFee = 0,
) {
  return {
    id: room.id,
    title: room.title,
    category: room.category,
    status: room.status,
    viewerCount: room.viewerCount,
    totalLikes: room.totalLikes,
    totalGiftsPoints: room.totalGiftsPoints,
    entryFee: Math.max(0, Number(entryFee || room?.entryFee || 0)),
    coverUri: room.coverUri || room.host?.profile?.avatarUri || null,
    startedAt: room.startedAt,
    endedAt: room.endedAt,
    streamDeliveryMode: streamConfig?.mode || 'AGORA_RTC',
    hlsPlaybackUrl: streamConfig?.hlsPlaybackUrl || null,
    rtmpPushUrl: streamConfig?.rtmpPushUrl || null,
    host: {
      id: room.host.id,
      name:
        room.host.profile?.nickname ||
        room.host.displayName ||
        '호스트',
      avatar: room.host.profile?.avatarUri || null,
      region:
        [room.host.region1, room.host.region2].filter(Boolean).join(' · ') ||
        '지역 미설정',
      headline: room.host.profile?.headline || null,
      targetAccountId: room.hostAccount?.id || null,
    },
  };
}

@Injectable()
export class LiveService {
  private readonly activeViewersByRoom = new Map<string, Set<string>>();
  private readonly roomEntryFees = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly giftsService: GiftsService,
    private readonly adminSettings: AdminSettingsService,
    private readonly livePublisher: LiveRealtimePublisher,
  ) {}

  async createRoom(hostUserId: string, dto: CreateLiveRoomDto) {
    if (!hostUserId) {
      throw new BadRequestException('로그인이 필요합니다.');
    }

    const hostAccount = await this.prisma.activityAccount.findFirst({
      where: {
        legacyUserId: hostUserId,
        status: 'active',
      },
      select: { id: true },
    });

    const activeRoom = await this.prisma.liveRoom.findFirst({
      where: {
        hostId: hostUserId,
        status: 'live',
      },
    });

    if (activeRoom) {
      return formatRoom(
        await this.prisma.liveRoom.findUnique({
          where: { id: activeRoom.id },
          include: HOST_INCLUDE,
        }),
      );
    }

    const pointPolicy = await this.adminSettings.getActionPointPolicy();
    const room = await this.prisma.$transaction(async (tx) => {
      if (pointPolicy.liveRoomCreate.enabled && pointPolicy.liveRoomCreate.amount > 0) {
        await this.adminSettings.deductUserPoints(
          tx,
          hostUserId,
          pointPolicy.liveRoomCreate.amount,
          'create_live_room',
          `live_create_${hostUserId}_${Date.now()}`,
          { title: dto.title.trim() },
        );
      }

      return tx.liveRoom.create({
        data: {
          hostId: hostUserId,
          hostAccountId: hostAccount?.id || null,
          title: dto.title.trim(),
          category: dto.category?.trim() || 'talk',
          coverUri: dto.coverUri?.trim() || null,
          status: 'live',
          viewerCount: 1,
        },
        include: HOST_INCLUDE,
      });
    });

    if (dto.entryFee !== undefined) {
      this.roomEntryFees.set(room.id, Math.max(0, dto.entryFee));
    }

    const formatted = formatRoom(room, undefined, this.roomEntryFees.get(room.id) ?? 0);
    const agoraToken = await this.getAgoraToken(room.id, hostUserId, 'publisher').catch(() => null);

    return {
      ...formatted,
      agoraToken,
    };
  }

  async getStreamConfigForRoom(roomId: string) {
    const config = await this.adminSettings.getLiveStreamingConfig();
    const hlsPlaybackUrl = config.cdnHlsUrlPattern
      ? config.cdnHlsUrlPattern.replace('{roomId}', roomId)
      : `https://live-cdn.dagaon.app/live/${roomId}/index.m3u8`;
    const rtmpPushUrl = config.cdnRtmpPushUrl
      ? config.cdnRtmpPushUrl.replace('{roomId}', roomId)
      : `rtmp://live-push.dagaon.app/live/${roomId}`;
    return {
      mode: config.mode,
      hlsPlaybackUrl: config.mode === 'CDN_HLS' ? hlsPlaybackUrl : null,
      rtmpPushUrl: config.mode === 'CDN_HLS' ? rtmpPushUrl : null,
    };
  }

  async getLiveStreamingConfig() {
    return this.adminSettings.getLiveStreamingConfig();
  }

  async setLiveStreamingConfig(
    actorId: string,
    dto: {
      mode?: 'AGORA_RTC' | 'CDN_HLS';
      cdnHlsUrlPattern?: string;
      cdnRtmpPushUrl?: string;
    },
  ) {
    return this.adminSettings.setLiveStreamingConfig(actorId, dto);
  }

  async listActiveRooms() {
    const streamConfig = await this.adminSettings.getLiveStreamingConfig();
    const rooms = await this.prisma.liveRoom.findMany({
      where: { status: 'live' },
      orderBy: [{ viewerCount: 'desc' }, { startedAt: 'desc' }],
      include: HOST_INCLUDE,
    });

    return rooms.map((r) => {
      const hlsPlaybackUrl =
        streamConfig.mode === 'CDN_HLS' && streamConfig.cdnHlsUrlPattern
          ? streamConfig.cdnHlsUrlPattern.replace('{roomId}', r.id)
          : null;
      return formatRoom(
        r,
        {
          mode: streamConfig.mode,
          hlsPlaybackUrl,
        },
        this.roomEntryFees.get(r.id) ?? 0,
      );
    });
  }

  async getRoom(roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: HOST_INCLUDE,
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    const streamConfig = await this.getStreamConfigForRoom(roomId);
    return formatRoom(room, streamConfig, this.roomEntryFees.get(room.id) ?? 0);
  }

  async endRoom(hostUserId: string, roomId: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    if (room.hostId !== hostUserId) {
      throw new ForbiddenException('라이브를 종료할 권한이 없습니다.');
    }

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        viewerCount: 0,
      },
      include: HOST_INCLUDE,
    });

    this.activeViewersByRoom.delete(roomId);

    this.livePublisher.publishEnd({
      roomId,
      reason: '호스트가 방송을 종료했습니다.',
    });

    return formatRoom(updated);
  }

  async joinRoom(roomId: string, viewerKey?: string, userId?: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.status !== 'live') {
      return { success: false, viewerCount: 0 };
    }

    // 시청자 라이브 참여 포인트 소모 정책 확인 (호스트 설정 우선 적용)
    if (userId && room.hostId !== userId) {
      const customEntryFee = this.roomEntryFees.get(roomId);
      const pointPolicy = await this.adminSettings.getActionPointPolicy();
      const requiredAmount =
        customEntryFee !== undefined
          ? customEntryFee
          : pointPolicy.liveRoomJoin.enabled
          ? pointPolicy.liveRoomJoin.amount
          : 0;

      if (requiredAmount > 0) {
        const idempotencyKey = `live_join_${roomId}_${userId}`;
        const existingPayment = await this.prisma.walletLedgerEntry.findUnique({
          where: { idempotencyKey },
        });

        if (!existingPayment) {
          await this.prisma.$transaction(async (tx) => {
            await this.adminSettings.deductUserPoints(
              tx,
              userId,
              requiredAmount,
              'join_live_room',
              idempotencyKey,
              { roomId, roomTitle: room.title, entryFee: requiredAmount },
            );
          });
        }
      }
    }

    let viewers = this.activeViewersByRoom.get(roomId);
    if (!viewers) {
      viewers = new Set<string>();
      this.activeViewersByRoom.set(roomId, viewers);
    }

    let shouldIncrement = true;
    if (viewerKey) {
      if (viewers.has(viewerKey)) {
        shouldIncrement = false;
      } else {
        viewers.add(viewerKey);
      }
    }

    let newCount = room.viewerCount;
    if (shouldIncrement) {
      const updated = await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { viewerCount: { increment: 1 } },
        select: { viewerCount: true },
      });
      newCount = updated.viewerCount;
    }

    const trackedCount = Math.max(viewers.size, newCount, 1);
    if (trackedCount !== newCount) {
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { viewerCount: trackedCount },
      });
      newCount = trackedCount;
    }

    this.livePublisher.publishViewer({
      roomId,
      viewerCount: newCount,
    });

    return { success: true, viewerCount: newCount };
  }

  async leaveRoom(roomId: string, viewerKey?: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      select: { viewerCount: true, status: true },
    });

    if (!room || room.status !== 'live' || room.viewerCount <= 0) {
      if (viewerKey) {
        this.activeViewersByRoom.get(roomId)?.delete(viewerKey);
      }
      return { success: true, viewerCount: 0 };
    }

    let viewers = this.activeViewersByRoom.get(roomId);
    let shouldDecrement = true;
    if (viewerKey) {
      if (!viewers || !viewers.has(viewerKey)) {
        shouldDecrement = false;
      } else {
        viewers.delete(viewerKey);
      }
    }

    let count = room.viewerCount;
    if (shouldDecrement) {
      const updated = await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { viewerCount: { decrement: 1 } },
        select: { viewerCount: true },
      });
      count = Math.max(0, updated.viewerCount);
    }

    if (viewers && viewers.size === 0 && count > 1) {
      count = 1;
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { viewerCount: count },
      });
    }

    this.livePublisher.publishViewer({
      roomId,
      viewerCount: count,
    });

    return { success: true, viewerCount: count };
  }

  async sendMessage(senderUserId: string, roomId: string, dto: SendLiveMessageDto) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room || room.status !== 'live') {
      throw new BadRequestException('진행 중인 라이브 룸이 아닙니다.');
    }

    const senderAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: senderUserId, status: 'active' },
      select: { id: true },
    });

    const msgType = dto.type || 'chat';
    const giftPoints = dto.giftPoints || null;

    if (msgType === 'like') {
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { totalLikes: { increment: 1 } },
      });
    } else if (msgType === 'gift' && giftPoints) {
      await this.prisma.liveRoom.update({
        where: { id: roomId },
        data: { totalGiftsPoints: { increment: giftPoints } },
      });
    }

    const message = await this.prisma.liveMessage.create({
      data: {
        roomId,
        senderId: senderUserId,
        senderAccountId: senderAccount?.id || null,
        type: msgType,
        content: dto.content.trim(),
        giftPoints,
      },
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profile: {
              select: {
                nickname: true,
                avatarUri: true,
              },
            },
          },
        },
      },
    });

    const result = {
      id: message.id,
      roomId: message.roomId,
      type: message.type,
      content: message.content,
      giftPoints: message.giftPoints,
      createdAt: message.createdAt,
      sender: {
        id: message.sender.id,
        name:
          message.sender.profile?.nickname ||
          message.sender.displayName ||
          '회원',
        avatar: message.sender.profile?.avatarUri || null,
      },
    };

    this.livePublisher.publishMessage({ roomId, message: result });

    return result;
  }

  async listMessages(roomId: string, limit: number = 40) {
    const messages = await this.prisma.liveMessage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            displayName: true,
            profile: {
              select: {
                nickname: true,
                avatarUri: true,
              },
            },
          },
        },
      },
    });

    return messages
      .reverse()
      .map((msg) => ({
        id: msg.id,
        roomId: msg.roomId,
        type: msg.type,
        content: msg.content,
        giftPoints: msg.giftPoints,
        createdAt: msg.createdAt,
        sender: {
          id: msg.sender.id,
          name:
            msg.sender.profile?.nickname ||
            msg.sender.displayName ||
            '회원',
          avatar: msg.sender.profile?.avatarUri || null,
        },
      }));
  }

  async getAdminSummary() {
    const [totalRooms, activeLiveRooms, totalGiftPoints, currentViewers] = await Promise.all([
      this.prisma.liveRoom.count(),
      this.prisma.liveRoom.count({ where: { status: 'live' } }),
      this.prisma.liveRoom.aggregate({ _sum: { totalGiftsPoints: true, totalLikes: true } }),
      this.prisma.liveRoom.aggregate({
        where: { status: 'live' },
        _sum: { viewerCount: true },
      }),
    ]);

    return {
      totalRooms,
      activeLiveRooms,
      totalGiftPoints: totalGiftPoints._sum.totalGiftsPoints ?? 0,
      totalLikes: totalGiftPoints._sum.totalLikes ?? 0,
      currentViewers: currentViewers._sum.viewerCount ?? 0,
    };
  }

  async listAdminRooms(opts: { status?: string; skip: number; take: number }) {
    const where: any = {};
    if (opts.status && opts.status !== 'all') {
      where.status = opts.status;
    }

    const [total, rooms] = await Promise.all([
      this.prisma.liveRoom.count({ where }),
      this.prisma.liveRoom.findMany({
        where,
        skip: opts.skip,
        take: opts.take,
        orderBy: { startedAt: 'desc' },
        include: HOST_INCLUDE,
      }),
    ]);

    return {
      total,
      items: rooms.map((r) => formatRoom(r)),
    };
  }

  async forceEndRoom(adminId: string, roomId: string, reason?: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.liveRoom.update({
      where: { id: roomId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        viewerCount: 0,
      },
      include: HOST_INCLUDE,
    });

    this.livePublisher.publishEnd({
      roomId,
      reason: reason || '관리자 권한 강제 종료',
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId || null,
        target: `liveRoom:${roomId}`,
        action: 'ADMIN_FORCE_END_LIVE_ROOM',
        reason: reason || '관리자 권한 강제 종료',
        context: {
          hostId: room.hostId,
          totalGiftsPoints: room.totalGiftsPoints,
        },
      },
    });

    return formatRoom(updated);
  }

  async getAgoraToken(roomId: string, userId: string, requestedRole?: string) {
    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      select: { id: true, hostId: true, status: true },
    });

    if (!room) {
      throw new NotFoundException('라이브 룸을 찾을 수 없습니다.');
    }

    if (room.status === 'ended') {
      throw new BadRequestException('이미 종료된 방송입니다.');
    }

    const isHost = room.hostId === userId;
    const streamConfig = await this.getStreamConfigForRoom(roomId);

    // CDN 중계 모드에서 일반 시청자(Subscriber)는 Agora 토큰 과금 없이 CDN HLS URL로 직결 재생
    if (!isHost && streamConfig.mode === 'CDN_HLS') {
      return {
        appId: 'dagaon_agora_live',
        channelName: roomId,
        uid: userIdToAgoraUid(userId),
        role: 'subscriber' as const,
        streamDeliveryMode: 'CDN_HLS' as const,
        hlsPlaybackUrl: streamConfig.hlsPlaybackUrl,
        rtmpPushUrl: null,
        token: `cdn_hls_stream_${roomId}`,
        expiresAt: Math.floor(Date.now() / 1000) + 86400,
        isFallback: false,
        isHost: false,
      };
    }

    const role = isHost
      ? AgoraRole.PUBLISHER
      : requestedRole === 'publisher' && isHost
        ? AgoraRole.PUBLISHER
        : AgoraRole.SUBSCRIBER;

    const dynamicAppId = await this.adminSettings.getDecryptedSetting('agora_app_id');
    const dynamicCert = await this.adminSettings.getDecryptedSetting('agora_app_certificate');

    const agoraAppId = dynamicAppId || process.env.AGORA_APP_ID || '';
    const agoraAppCertificate = dynamicCert || process.env.AGORA_APP_CERTIFICATE || '';
    const numericUid = userIdToAgoraUid(userId);

    const tokenResult = buildAgoraToken({
      appId: agoraAppId,
      appCertificate: agoraAppCertificate,
      channelName: roomId,
      uid: numericUid,
      role,
    });

    return {
      ...tokenResult,
      streamDeliveryMode: streamConfig.mode,
      hlsPlaybackUrl: streamConfig.hlsPlaybackUrl,
      rtmpPushUrl: isHost && streamConfig.mode === 'CDN_HLS' ? streamConfig.rtmpPushUrl : null,
      isHost,
    };
  }

  async sendGiftToRoom(
    senderUserId: string,
    roomId: string,
    dto: SendLiveGiftDto,
  ) {
    if (!senderUserId) {
      throw new BadRequestException('로그인이 필요합니다.');
    }

    const room = await this.prisma.liveRoom.findUnique({
      where: { id: roomId },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            pointsBalance: true,
          },
        },
      },
    });

    if (!room || room.status !== 'live') {
      throw new NotFoundException('진행 중인 라이브 방송을 찾을 수 없습니다.');
    }

    if (room.hostId === senderUserId) {
      throw new BadRequestException('호스트 자신에게는 선물을 보낼 수 없습니다.');
    }

    const gift = await this.giftsService.getGiftById(dto.giftId);
    if (!gift || !gift.isActive || !gift.liveEnabled) {
      throw new NotFoundException('유효하지 않거나 라이브에서 전송할 수 없는 선물입니다.');
    }

    const senderAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: senderUserId, status: 'active' },
      include: { wallet: true },
    });

    if (!senderAccount) {
      throw new BadRequestException('발신자 계정을 찾을 수 없습니다.');
    }

    let senderWallet = senderAccount.wallet;
    if (!senderWallet) {
      senderWallet = await this.prisma.wallet.create({
        data: { activityAccountId: senderAccount.id },
      });
    }

    if (senderWallet.spendableBalance < gift.pricePoints) {
      throw new BadRequestException(
        `포인트가 부족합니다. (필요: ${gift.pricePoints}P, 보유: ${senderWallet.spendableBalance}P)`,
      );
    }

    let hostAccount = await this.prisma.activityAccount.findFirst({
      where: { legacyUserId: room.hostId, status: 'active' },
      include: { wallet: true },
    });

    if (!hostAccount) {
      const owner = await this.prisma.owner.upsert({
        where: { legacyUserId: room.hostId },
        update: {},
        create: { legacyUserId: room.hostId },
      });
      hostAccount = await this.prisma.activityAccount.create({
        data: {
          ownerId: owner.id,
          legacyUserId: room.hostId,
          isPrimary: true,
        },
        include: { wallet: true },
      });
    }

    let hostWallet = hostAccount.wallet;
    if (!hostWallet) {
      hostWallet = await this.prisma.wallet.create({
        data: { activityAccountId: hostAccount.id },
      });
    }

    const clientTxId =
      dto.idempotencyKey ||
      `live_gift_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const existingTx = await this.prisma.giftTransaction.findUnique({
      where: { idempotencyKey: `gift-tx:live:${roomId}:${clientTxId}` },
    });
    if (existingTx) {
      return {
        ok: true,
        alreadyProcessed: true,
        transactionId: existingTx.id,
        gift,
        totalGiftsPoints: room.totalGiftsPoints,
      };
    }

    const senderUser = await this.prisma.user.findUnique({
      where: { id: senderUserId },
      include: { profile: true },
    });
    const senderNickname =
      senderUser?.profile?.nickname || senderUser?.displayName || '시청자';

    const result = await this.prisma.$transaction(async (tx) => {
      const newSenderBalance = senderWallet.spendableBalance - gift.pricePoints;
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { spendableBalance: newSenderBalance },
      });
      await tx.user.update({
        where: { id: senderUserId },
        data: { pointsBalance: newSenderBalance },
      });

      const newHostBalance = hostWallet.spendableBalance + gift.pricePoints;
      await tx.wallet.update({
        where: { id: hostWallet.id },
        data: {
          spendableBalance: newHostBalance,
          redeemableBalance: { increment: gift.pricePoints },
        },
      });
      await tx.user.update({
        where: { id: room.hostId },
        data: { pointsBalance: newHostBalance },
      });

      await tx.walletLedgerEntry.create({
        data: {
          walletId: senderWallet.id,
          kind: 'debit',
          source: 'live_gift',
          deltaSpendable: -gift.pricePoints,
          spendableAfter: newSenderBalance,
          redeemableAfter: senderWallet.redeemableBalance,
          pendingAfter: senderWallet.pendingEarnings,
          idempotencyKey: `live-gift:${roomId}:${clientTxId}:sender`,
          referenceType: 'LiveRoom',
          referenceId: roomId,
          metadata: {
            giftId: gift.id,
            giftName: gift.name,
            points: gift.pricePoints,
            recipientAccountId: hostAccount.id,
          },
        },
      });

      await tx.walletLedgerEntry.create({
        data: {
          walletId: hostWallet.id,
          kind: 'credit',
          source: 'live_gift',
          deltaSpendable: gift.pricePoints,
          deltaRedeemable: gift.pricePoints,
          spendableAfter: newHostBalance,
          redeemableAfter: hostWallet.redeemableBalance + gift.pricePoints,
          pendingAfter: hostWallet.pendingEarnings,
          idempotencyKey: `live-gift:${roomId}:${clientTxId}:recipient`,
          referenceType: 'LiveRoom',
          referenceId: roomId,
          metadata: {
            giftId: gift.id,
            giftName: gift.name,
            points: gift.pricePoints,
            senderAccountId: senderAccount.id,
          },
        },
      });

      const transaction = await tx.giftTransaction.create({
        data: {
          giftId: gift.id,
          senderAccountId: senderAccount.id,
          recipientAccountId: hostAccount.id,
          contextType: 'live',
          liveRoomId: roomId,
          points: gift.pricePoints,
          idempotencyKey: `gift-tx:live:${roomId}:${clientTxId}`,
          message: dto.message || `${senderNickname}님이 ${gift.name}을(를) 선물했습니다.`,
        },
      });

      const updatedRoom = await tx.liveRoom.update({
        where: { id: roomId },
        data: { totalGiftsPoints: { increment: gift.pricePoints } },
      });

      const giftMessageContent = JSON.stringify({
        giftId: gift.id,
        code: gift.code,
        giftName: gift.name,
        pricePoints: gift.pricePoints,
        animationUrl: gift.animationUrl,
        animationType: gift.animationType,
        thumbnailUrl: gift.thumbnailUrl,
        senderNickname,
        message: dto.message || '',
      });

      const liveMessage = await tx.liveMessage.create({
        data: {
          roomId,
          senderId: senderUserId,
          senderAccountId: senderAccount.id,
          type: 'gift',
          content: giftMessageContent,
          giftPoints: gift.pricePoints,
        },
        include: {
          sender: {
            select: {
              id: true,
              displayName: true,
              profile: {
                select: {
                  nickname: true,
                  avatarUri: true,
                },
              },
            },
          },
        },
      });

      return {
        transaction,
        updatedRoom,
        liveMessage,
        newBalance: newSenderBalance,
      };
    });

    this.livePublisher.publishMessage({
      roomId,
      message: {
        id: result.liveMessage.id,
        roomId: result.liveMessage.roomId,
        type: result.liveMessage.type,
        content: result.liveMessage.content,
        giftPoints: result.liveMessage.giftPoints,
        createdAt: result.liveMessage.createdAt,
        sender: {
          id: result.liveMessage.sender.id,
          name:
            result.liveMessage.sender.profile?.nickname ||
            result.liveMessage.sender.displayName ||
            senderNickname,
          avatar: result.liveMessage.sender.profile?.avatarUri || null,
        },
      },
    });

    return {
      ok: true,
      transactionId: result.transaction.id,
      gift: {
        id: gift.id,
        code: gift.code,
        name: gift.name,
        pricePoints: gift.pricePoints,
        animationUrl: gift.animationUrl,
        animationType: gift.animationType,
        thumbnailUrl: gift.thumbnailUrl,
      },
      senderNickname,
      totalGiftsPoints: result.updatedRoom.totalGiftsPoints,
      newBalance: result.newBalance,
      message: result.liveMessage,
    };
  }
}

