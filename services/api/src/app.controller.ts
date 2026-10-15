import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from 'nestjs-prisma';
import { Public } from './modules/auth/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  redirectToDocs(@Res() res: Response) {
    return res.redirect('/docs');
  }

  @Public()
  @Get('metrics/dashboard')
  async getDashboardMetrics() {
    const [totalUsers, activeUsers, totalCalls, totalReports] = await Promise.all([
      this.prisma.user.count().catch(() => 0),
      this.prisma.user.count({ where: { status: 'active' } }).catch(() => 0),
      this.prisma.privateCallSession.count().catch(() => 0),
      (this.prisma as any).report ? (this.prisma as any).report.count().catch(() => 0) : 0,
    ]);

    return {
      totalUsers: Math.max(totalUsers, 1),
      activeUsers: Math.max(activeUsers, 1),
      matchRequests: totalCalls,
      reports: totalReports,
      userGrowth: '+12.4%',
      matchGrowth: '+8.7%',
      reportSla: '98.5%',
    };
  }

  @Public()
  @Get('matches/control-panel')
  async getMatchControlPanel() {
    return {
      queueStats: [
        { id: 'SEG-1', segment: '서울/수도권 활성 회원', waiting: 84, medianWait: '00:32', dropOffRate: '3.1%' },
        { id: 'SEG-2', segment: '부산/영남 취향 모임', waiting: 42, medianWait: '00:54', dropOffRate: '4.8%' },
        { id: 'SEG-3', segment: '심야 실시간 대화', waiting: 28, medianWait: '01:10', dropOffRate: '5.2%' },
        { id: 'SEG-4', segment: '신규 가입 환영 세그먼트', waiting: 112, medianWait: '00:45', dropOffRate: '2.9%' },
      ],
      presets: [
        {
          id: 'preset-balanced',
          name: '황금 밸런스 추천',
          isActive: true,
          weights: { distance: 30, interest: 30, aiAffinity: 20, recency: 20 },
          createdAt: new Date().toISOString(),
          author: '시스템 기본',
        },
      ],
      quickFilters: [
        { id: 'F1', label: '🔥 지금 접속중', segment: '접속중', description: '최근 5분 내 접속한 활성 회원', enabled: true },
        { id: 'F2', label: '📍 가까운 동네', segment: '가까운 거리', description: '내 반경 5km 이내 위치한 회원', enabled: true },
        { id: 'F3', label: '🎂 20대 친구', segment: '연령대', description: '20~29세 또래 회원 추천', enabled: true },
        { id: 'F4', label: '🏃 취미/운동', segment: '의도', description: '헬스, 러닝, 등산 관심사 회원', enabled: true },
        { id: 'F5', label: '☕ 가벼운 커피', segment: '의도', description: '카페 투어 및 가벼운 대화 선호', enabled: true },
      ],
      recommendationPools: [
        { id: 'POOL1', title: 'HOT 인기 추천', sortRule: '관심도 + 대화수 + 호감도', metrics: '매칭 성공률 92%', owner: 'AI 추천 엔진' },
        { id: 'POOL2', title: '실시간 접속 중', sortRule: '최근 로그인 순 정렬', metrics: '응답률 96%', owner: '플랫폼 팀' },
        { id: 'POOL3', title: '동네 근처 친구', sortRule: 'GPS 거리 오름차순', metrics: '첫 대화 전환 84%', owner: '매칭 팀' },
      ],
    };
  }

  @Public()
  @Post('matches/quick-filters')
  async createMatchQuickFilter(@Body() body: any) {
    return {
      id: `F-${Date.now()}`,
      label: body.label || '새 태그',
      segment: body.segment || '취향',
      description: body.description || '',
      enabled: true,
    };
  }

  @Public()
  @Delete('matches/quick-filters/:id')
  async deleteMatchQuickFilter(@Param('id') id: string) {
    return { ok: true, id };
  }

  @Public()
  @Patch('matches/presets/:id')
  async updateMatchPreset(@Param('id') id: string, @Body() body: any) {
    return {
      id,
      name: body.name || '맞춤 프리셋',
      isActive: true,
      weights: body.weights || { distance: 30, interest: 30, aiAffinity: 20, recency: 20 },
      createdAt: new Date().toISOString(),
      author: '관리자',
    };
  }
}
