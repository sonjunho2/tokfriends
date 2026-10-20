import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import * as fs from 'fs';
import * as path from 'path';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { decryptAdminSettingValue, encryptAdminSettingValue } from '../admin/admin-settings.crypto';

const MOCK_LIVE_ROOMS = [
  {
    id: 'LIVE-101',
    title: '불금 소통 방송 놀러오세요 ✨ 하트 환영!',
    category: '일상/토크',
    type: 'PUBLIC_1_TO_N',
    status: 'ACTIVE',
    viewerCount: 84,
    totalLikes: 2150,
    totalGiftsPoints: 520000,
    coverUri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500',
    startedAt: '2026-10-15 11:10',
    endedAt: null,
    flagged: false,
    host: {
      id: 'u101',
      name: '이지민',
      displayName: '이지민',
      nickname: '이지민',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120',
      region: '서울 강남구',
      headline: '음악과 일상을 공유하는 지민입니다 🎵',
    },
  },
  {
    id: 'LIVE-102',
    title: '서아와의 1:1 비밀 프라이빗 라이브 💬',
    category: '1:1 프라이빗',
    type: 'PRIVATE_1_TO_1',
    status: 'ACTIVE',
    viewerCount: 1,
    totalLikes: 340,
    totalGiftsPoints: 210000,
    coverUri: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500',
    startedAt: '2026-10-15 11:30',
    endedAt: null,
    flagged: false,
    host: {
      id: 'u102',
      name: '박서아',
      displayName: '박서아',
      nickname: '박서아',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
      region: '부산 해운대구',
      headline: '진솔한 1:1 고민 상담 환영해요 :)',
    },
  },
  {
    id: 'LIVE-103',
    title: '가을 단풍 여행 준비 같이해요 🍁',
    category: '여행/야외',
    type: 'PUBLIC_1_TO_N',
    status: 'ACTIVE',
    viewerCount: 57,
    totalLikes: 1350,
    totalGiftsPoints: 115000,
    coverUri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500',
    startedAt: '2026-10-15 11:05',
    endedAt: null,
    flagged: true,
    flagReason: '비정상 후원 유도 키워드 감지 (관리자 주의 요망)',
    host: {
      id: 'u103',
      name: '최유나',
      displayName: '최유나',
      nickname: '최유나',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
      region: '대구 수성구',
      headline: '전국 방방곡곡 맛집/여행 크리에이터',
    },
  },
  {
    id: 'LIVE-104',
    title: '심야 라디오 & 고민 나눔 🌙',
    category: '보이스/라디오',
    type: 'PUBLIC_1_TO_N',
    status: 'ENDED',
    viewerCount: 0,
    totalLikes: 890,
    totalGiftsPoints: 85000,
    coverUri: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500',
    startedAt: '2026-10-15 09:00',
    endedAt: '2026-10-15 10:30',
    flagged: false,
    host: {
      id: 'u104',
      name: '강도윤',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120',
      region: '인천 연수구',
      headline: '마음을 편안하게 해주는 목소리',
    },
  },
];

@ApiTags('live')
@Controller('live')
export class LiveController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 관리자 라이브 지표 요약
   */
  @Public()
  @Get('admin/summary')
  async getAdminLiveSummary() {
    return {
      ok: true,
      data: {
        totalRooms: 128,
        activeLiveRooms: 3,
        currentViewers: 142,
        totalGiftPoints: 845000,
        totalLikes: 3840,
      },
    };
  }

  /**
   * 관리자 라이브 방송 목록 (1:N 및 1:1 라이브 분리 지원)
   */
  @Public()
  @Get('admin/rooms')
  async getAdminLiveRooms(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    let items = [...MOCK_LIVE_ROOMS];
    if (status && status !== 'all') {
      items = items.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }

    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 20);

    return {
      ok: true,
      page: p,
      limit: l,
      total: items.length,
      totalPages: Math.ceil(items.length / l) || 1,
      items,
    };
  }

  /**
   * 관리자 라이브 방송 강제 종료
   */
  @Public()
  /**
   * 모바일 앱용 활성 라이브 방송 목록
   */
  @Public()
  @Get(['rooms', 'active'])
  async getLiveRooms(@Query('category') category?: string) {
    let rooms = MOCK_LIVE_ROOMS.filter((r) => r.status === 'ACTIVE');
    if (category && category !== 'all' && category !== '전체') {
      rooms = rooms.filter((r) => r.category.includes(category) || category.includes(r.category));
    }
    return { ok: true, data: rooms, items: rooms };
  }

  /**
   * 모바일 앱용 단일 라이브 방송 상세
   */
  @Public()
  @Get('rooms/:id')
  async getLiveRoomById(@Param('id') id: string) {
    const room = MOCK_LIVE_ROOMS.find((r) => r.id === id) || {
      id,
      title: '실시간 소통 라이브 방송',
      category: '일상/토크',
      status: 'ACTIVE',
      viewerCount: 15,
      totalLikes: 120,
      totalGiftsPoints: 5000,
      coverUri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      startedAt: new Date().toISOString(),
      host: { id: 'u-host', name: '호스트', avatar: null, region: '서울' },
    };
    return { ok: true, data: room, room };
  }

  private getActionPolicy(): any {
    try {
      const p = path.join(process.cwd(), 'data', 'action-point-policy.json');
      if (fs.existsSync(p)) {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
      }
    } catch {}
    return {
      chatRoomCreate: { enabled: true, amount: 10 },
      chatRoomJoin: { enabled: false, amount: 0 },
      directMessageRequest: { enabled: true, amount: 5 },
      liveRoomCreate: { enabled: true, amount: 50 },
      liveRoomJoin: { enabled: false, amount: 0 },
    };
  }

  /**
   * 모바일 앱용 신규 라이브 방송 개설
   */
  @Public()
  @Post('rooms')
  async createLiveRoom(@CurrentUser() user: any, @Body() body: any) {
    const userId = user?.id || user?.sub || 'usr_host';
    const policy = this.getActionPolicy();

    // 관리자 라이브 개설 온 소모 정책 적용
    const requiredPoints = policy?.liveRoomCreate?.enabled
      ? Math.max(0, Number(policy.liveRoomCreate.amount) || 0)
      : 0;

    let updatedBalance: number | null = null;
    if (userId && requiredPoints > 0) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pointBalance: true },
        });
        if (dbUser) {
          if ((dbUser.pointBalance ?? 0) < requiredPoints) {
            throw new BadRequestException(
              `라이브 방송 개설에 필요한 온(ON)이 부족합니다. (필요: ${requiredPoints} 온, 보유: ${dbUser.pointBalance ?? 0} 온)`,
            );
          }
          const saved = await this.prisma.user.update({
            where: { id: userId },
            data: { pointBalance: { decrement: requiredPoints } },
            select: { pointBalance: true },
          });
          updatedBalance = saved.pointBalance;
        }
      } catch (err) {
        if (err instanceof BadRequestException) throw err;
      }
    }

    const newRoom = {
      id: `LIVE-${Date.now()}`,
      title: body.title || '즐거운 소통 방송',
      category: body.category || '일상/토크',
      type: body.type || 'PUBLIC_1_TO_N',
      status: 'ACTIVE',
      entryFee: Number(body.entryFee || 0),
      viewerCount: 1,
      totalLikes: 0,
      totalGiftsPoints: 0,
      coverUri: body.coverUri || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      startedAt: new Date().toISOString(),
      endedAt: null,
      flagged: false,
      host: {
        id: userId,
        name: user?.nickname || user?.displayName || '나의 라이브',
        displayName: user?.nickname || user?.displayName || '나의 라이브',
        nickname: user?.nickname || user?.displayName || '나의 라이브',
        avatar: user?.avatarUrl || null,
        avatarUrl: user?.avatarUrl || null,
        region: '서울 강남구',
        headline: user?.bio || '반가워요!',
      },
    };
    MOCK_LIVE_ROOMS.unshift(newRoom);
    return { ok: true, data: newRoom, room: newRoom, remainingBalance: updatedBalance };
  }

  /**
   * 모바일 앱용 라이브 방 입장
   */
  @Public()
  @Post('rooms/:id/join')
  async joinLiveRoom(@CurrentUser() user: any, @Param('id') id: string) {
    const room = MOCK_LIVE_ROOMS.find((r) => r.id === id);
    if (room) room.viewerCount = (room.viewerCount || 0) + 1;

    const userId = user?.id || user?.sub;
    const policy = this.getActionPolicy();
    const entryFee = Number((room as any)?.entryFee || 0);
    const policyFee = policy?.liveRoomJoin?.enabled ? Number(policy.liveRoomJoin.amount) || 0 : 0;
    const feeToDeduct = entryFee > 0 ? entryFee : policyFee;

    let updatedBalance: number | null = null;
    if (userId && feeToDeduct > 0) {
      try {
        const dbUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { pointBalance: true },
        });
        if (dbUser && (dbUser.pointBalance ?? 0) >= feeToDeduct) {
          const saved = await this.prisma.user.update({
            where: { id: userId },
            data: { pointBalance: { decrement: feeToDeduct } },
            select: { pointBalance: true },
          });
          updatedBalance = saved.pointBalance;
        }
      } catch {}
    }

    return { ok: true, data: room || { id, viewerCount: 1 }, remainingBalance: updatedBalance };
  }

  /**
   * 모바일 앱용 라이브 방 퇴장
   */
  @Public()
  @Post('rooms/:id/leave')
  async leaveLiveRoom(@Param('id') id: string) {
    const room = MOCK_LIVE_ROOMS.find((r) => r.id === id);
    if (room && room.viewerCount > 0) room.viewerCount -= 1;
    return { ok: true };
  }

  /**
   * 모바일 앱용 라이브 방 종료
   */
  @Public()
  @Post('rooms/:id/end')
  async endLiveRoom(@Param('id') id: string) {
    const room = MOCK_LIVE_ROOMS.find((r) => r.id === id);
    if (room) {
      room.status = 'ENDED';
      room.endedAt = new Date().toISOString();
    }
    return { ok: true, data: room || { id, status: 'ENDED' } };
  }

  /**
   * 모바일 앱용 라이브 좋아요
   */
  @Public()
  @Post('rooms/:id/like')
  async likeLiveRoom(@Param('id') id: string) {
    const room = MOCK_LIVE_ROOMS.find((r) => r.id === id);
    if (room) room.totalLikes = (room.totalLikes || 0) + 1;
    return { ok: true, totalLikes: room?.totalLikes || 1 };
  }

  /**
   * 모바일 앱용 라이브 채팅 메시지 전송
   */
  @Public()
  @Post('rooms/:id/messages')
  async sendLiveMessage(
    @Param('id') roomId: string,
    @Body() body: any,
    @CurrentUser() user?: any,
  ) {
    const msg = {
      id: `msg-${Date.now()}`,
      roomId,
      type: body.type || 'CHAT',
      content: body.content || '',
      giftPoints: body.giftPoints || null,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sender: {
        id: user?.id || body.senderId || 'guest',
        name: user?.nickname || body.senderName || '참여자',
        avatar: user?.avatarUrl || body.senderAvatar || null,
      },
    };
    return { ok: true, data: msg, message: msg };
  }

  /**
   * 모바일 앱용 라이브 선물 전송
   */
  @Public()
  @Post('rooms/:id/gift')
  async sendLiveGift(
    @Param('id') roomId: string,
    @Body() body: any,
    @CurrentUser() user?: any,
  ) {
    const userId = user?.id || user?.sub || 'usr_guest';
    const points = Number(body.points || 100);
    const giftId = body.giftId || 'gift-1';

    try {
      const dbUser = await this.prisma.user.findUnique({ where: { id: userId } });
      if (dbUser && dbUser.pointBalance < points) {
        throw new BadRequestException('보유 온(ON) 포인트가 부족합니다.');
      }
      if (dbUser) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { pointBalance: { decrement: points } },
        });
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
    }

    const room = MOCK_LIVE_ROOMS.find((r) => r.id === roomId);
    if (room) {
      room.totalGiftsPoints = (room.totalGiftsPoints || 0) + points;
    }

    return {
      ok: true,
      success: true,
      transactionId: `tx-${Date.now()}`,
      giftId,
      points,
      tier: points >= 30000 ? 3 : (points >= 3000 ? 2 : 1),
      message: `${points} ON 선물이 전달되었습니다!`,
    };
  }

  /**
   * 라이브 룸 실시간 채팅/선물 로그
   */
  @Public()
  @Get('rooms/:roomId/messages')
  async getLiveMessages(@Param('roomId') roomId: string) {
    return {
      ok: true,
      data: [
        {
          id: 'msg-1',
          roomId,
          type: 'CHAT',
          content: '안녕하세요 호스트님! 오늘 방송도 기대돼요~',
          giftPoints: null,
          createdAt: '11:15',
          sender: { id: 'u1', name: '김민준', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60' },
        },
        {
          id: 'msg-2',
          roomId,
          type: 'GIFT',
          content: '하트 50개 (5,000온) 선물',
          giftPoints: 5000,
          createdAt: '11:20',
          sender: { id: 'u2', name: '이수진', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60' },
        },
        {
          id: 'msg-3',
          roomId,
          type: 'CHAT',
          content: '오늘 의상 너무 예쁘세요 ㅎㅎ',
          giftPoints: null,
          createdAt: '11:25',
          sender: { id: 'u3', name: '정현우', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60' },
        },
      ],
    };
  }

  /**
   * 관리자 라이브 송출 아키텍처 설정 조회
   */
  @Public()
  @Get('admin/stream-config')
  async getStreamConfig() {
    let mode: 'AGORA_RTC' | 'CDN_HLS' = 'AGORA_RTC';
    let cdnHlsUrlPattern = 'https://live-cdn.dagaon.app/live/{channelName}/index.m3u8';
    let cdnRtmpPushUrl = 'rtmp://push-cdn.dagaon.app/live/{channelName}';

    try {
      const modeSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'live_stream_mode' },
      });
      if (modeSetting?.encryptedValue) {
        const val = decryptAdminSettingValue(modeSetting.encryptedValue, 'live_stream_mode');
        if (val === 'CDN_HLS' || val === 'AGORA_RTC') mode = val;
      }

      const hlsSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'cdn_hls_url_pattern' },
      });
      if (hlsSetting?.encryptedValue) {
        const val = decryptAdminSettingValue(hlsSetting.encryptedValue, 'cdn_hls_url_pattern');
        if (val) cdnHlsUrlPattern = val;
      }
    } catch {}

    return {
      ok: true,
      data: {
        mode,
        cdnHlsUrlPattern,
        cdnRtmpPushUrl,
      },
    };
  }

  /**
   * 관리자 라이브 송출 아키텍처 설정 저장
   */
  @Public()
  @Patch('admin/stream-config')
  async updateStreamConfig(@Body() body: { mode?: 'AGORA_RTC' | 'CDN_HLS'; cdnHlsUrlPattern?: string }) {
    if (body.mode) {
      try {
        await this.prisma.adminIntegrationSetting.upsert({
          where: { id: 'live_stream_mode' },
          create: {
            id: 'live_stream_mode',
            label: '라이브 송출 모드',
            encryptedValue: encryptAdminSettingValue(body.mode, 'live_stream_mode'),
          },
          update: {
            encryptedValue: encryptAdminSettingValue(body.mode, 'live_stream_mode'),
          },
        });
      } catch {}
    }

    return {
      ok: true,
      data: {
        mode: body.mode || 'AGORA_RTC',
        cdnHlsUrlPattern: body.cdnHlsUrlPattern || 'https://live-cdn.dagaon.app/live/{channelName}/index.m3u8',
      },
    };
  }

  /**
   * Agora RTC Live Streaming 토큰 발급
   * 사업자 관리자 설정(agora_app_id, agora_app_certificate) 연동
   */
  @Public()
  @Get('rooms/:roomId/agora-token')
  async getAgoraToken(
    @Param('roomId') roomId: string,
    @Query('role') role = 'subscriber',
  ) {
    let appId = process.env.AGORA_APP_ID || 'dagaon_agora_live';
    let appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
    let streamMode = 'AGORA_RTC';

    try {
      const idSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'agora_app_id' },
      });
      if (idSetting?.encryptedValue) {
        const val = decryptAdminSettingValue(idSetting.encryptedValue, 'agora_app_id');
        if (val && val.trim()) appId = val.trim();
      }

      const certSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'agora_app_certificate' },
      });
      if (certSetting?.encryptedValue) {
        const val = decryptAdminSettingValue(certSetting.encryptedValue, 'agora_app_certificate');
        if (val && val.trim()) appCertificate = val.trim();
      }

      const modeSetting = await this.prisma.adminIntegrationSetting.findUnique({
        where: { id: 'live_stream_mode' },
      });
      if (modeSetting?.encryptedValue) {
        const val = decryptAdminSettingValue(modeSetting.encryptedValue, 'live_stream_mode');
        if (val && val.trim()) streamMode = val.trim();
      }
    } catch {}

    const token = `tok_agora_${roomId}_${Date.now()}`;

    return {
      ok: true,
      appId,
      token,
      channelName: roomId,
      role,
      uid: Math.floor(Math.random() * 100000) + 1,
      streamDeliveryMode: streamMode,
      mode: streamMode,
    };
  }
}
