import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { Public } from '../auth/public.decorator';
import { decryptAdminSettingValue } from '../admin/admin-settings.crypto';

@ApiTags('live')
@Controller('live')
export class LiveController {
  constructor(private readonly prisma: PrismaService) {}

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
    } catch (e) {}

    // Mock/Dynamic RTC Token for mobile Agora client
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
