import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaService } from 'nestjs-prisma';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PrivateCallService } from '../calls/private-call.service';

export class UpdateSystemSettingDto {
  key: string;
  value: string;
  description?: string;
}

export class BatchUpdateSettingsDto {
  settings: Record<string, string>;
}

@ApiTags('admin-system-settings')
@Controller('admin/system-settings')
export class SystemSettingsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privateCallService: PrivateCallService,
  ) {}

  /**
   * 전체 시스템 설정 목록 조회 (기본값 자동 시딩 포함)
   */
  @Get()
  async getAllSettings() {
    // 필수 3대 정책 설정 기본값
    const defaultSettings = [
      { key: 'DEFAULT_CALL_RATE', value: '1200', description: '1:1 영상 통화 기본 분당 단가 (ON 포인트)' },
      { key: 'PLATFORM_FEE_PERCENT', value: '30', description: '플랫폼 수수료율 (%)' },
      { key: 'SNAPSHOT_INTERVAL_SEC', value: '20', description: '아고라 방송 실시간 AI 감시 주기 (초)' },
    ];

    for (const def of defaultSettings) {
      await this.prisma.systemSetting.upsert({
        where: { key: def.key },
        create: def,
        update: {},
      });
    }

    const settings = await this.prisma.systemSetting.findMany({
      orderBy: { key: 'asc' },
    });

    return {
      ok: true,
      data: settings,
    };
  }

  /**
   * 단일 설정 조회
   */
  @Get(':key')
  async getSetting(@Param('key') key: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    return {
      ok: true,
      data: setting,
    };
  }

  /**
   * 단일 설정 생성 또는 수정
   */
  @Post()
  async upsertSetting(@Body() dto: UpdateSystemSettingDto) {
    const updated = await this.prisma.systemSetting.upsert({
      where: { key: dto.key },
      create: {
        key: dto.key,
        value: String(dto.value),
        description: dto.description,
      },
      update: {
        value: String(dto.value),
        ...(dto.description ? { description: dto.description } : {}),
      },
    });

    // 백엔드 인메모리 캐시 무효화
    this.privateCallService.invalidateSettingCache(dto.key);

    return {
      ok: true,
      data: updated,
    };
  }

  /**
   * 다중 설정 일괄 업데이트
   */
  @Put()
  async batchUpdateSettings(@Body() dto: BatchUpdateSettingsDto) {
    const results = [];
    for (const [key, value] of Object.entries(dto.settings || {})) {
      const updated = await this.prisma.systemSetting.upsert({
        where: { key },
        create: {
          key,
          value: String(value),
        },
        update: {
          value: String(value),
        },
      });
      results.push(updated);
      this.privateCallService.invalidateSettingCache(key);
    }

    return {
      ok: true,
      data: results,
    };
  }

  /**
   * 설정 삭제
   */
  @Delete(':key')
  async deleteSetting(@Param('key') key: string) {
    await this.prisma.systemSetting.delete({
      where: { key },
    });
    this.privateCallService.invalidateSettingCache(key);

    return {
      ok: true,
      message: `Setting ${key} deleted`,
    };
  }
}
