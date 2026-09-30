import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateAdvertisementDto, UpdateAdvertisementDto } from './dto';

@Injectable()
export class AdvertisementsService implements OnModuleInit {
  private readonly logger = new Logger(AdvertisementsService.name);

  private readonly initialBanners = [
    {
      title: '다가온 첫 만남 웰컴 이벤트',
      description: '프로필을 완성하고 30분 내 50포인트를 즉시 받아가세요!',
      imageUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=800',
      targetUrl: '/my/profile-edit',
      placement: 'HOME_BANNER',
      priority: 10,
      rewardPoints: 50,
      isActive: true,
    },
    {
      title: '매일매일 무료 포인트 충전소',
      description: '출석체크 +5P, 영상 시청 +10P, 친구초대 +50P!',
      imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800',
      targetUrl: '/shop',
      placement: 'HOME_BANNER',
      priority: 8,
      rewardPoints: 10,
      isActive: true,
    },
    {
      title: '다가온 라이브 스트리밍 OPEN',
      description: '실시간 소통과 화려한 3D 선물 이펙트를 경험해보세요',
      imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      targetUrl: '/live',
      placement: 'LIVE_BANNER',
      priority: 5,
      rewardPoints: 0,
      isActive: true,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedDefaultsIfEmpty();
  }

  async seedDefaultsIfEmpty() {
    try {
      const count = await this.prisma.advertisement.count();
      if (count === 0) {
        this.logger.log('Seeding initial advertisements...');
        for (const banner of this.initialBanners) {
          await this.prisma.advertisement.create({
            data: banner,
          });
        }
        this.logger.log('Initial advertisements seeded successfully.');
      }
    } catch (err: any) {
      this.logger.warn(`Failed to seed advertisements: ${err?.message ?? err}`);
    }
  }

  async listActive(placement?: string) {
    const now = new Date();
    const where: any = {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    };

    if (placement && placement !== 'ALL') {
      where.placement = placement;
    }

    const items = await this.prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return items;
  }

  async recordClick(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    });
  }

  async recordImpression(id: string) {
    return this.prisma.advertisement.update({
      where: { id },
      data: { impressionCount: { increment: 1 } },
    });
  }

  // ===== 어드민(Admin) 전용 메서드 =====
  async listAllForAdmin(placement?: string) {
    const where: any = {};
    if (placement && placement !== 'ALL') {
      where.placement = placement;
    }

    return this.prisma.advertisement.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async create(dto: CreateAdvertisementDto) {
    return this.prisma.advertisement.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        imageUrl: dto.imageUrl.trim(),
        targetUrl: dto.targetUrl?.trim(),
        placement: dto.placement || 'HOME_BANNER',
        priority: dto.priority ?? 0,
        isActive: dto.isActive !== false,
        rewardPoints: dto.rewardPoints ?? 0,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
      },
    });
  }

  async update(id: string, dto: UpdateAdvertisementDto) {
    return this.prisma.advertisement.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl.trim() }),
        ...(dto.targetUrl !== undefined && { targetUrl: dto.targetUrl?.trim() }),
        ...(dto.placement !== undefined && { placement: dto.placement }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.rewardPoints !== undefined && { rewardPoints: dto.rewardPoints }),
        ...(dto.startsAt !== undefined && {
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
        }),
        ...(dto.endsAt !== undefined && {
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        }),
      },
    });
  }

  async delete(id: string) {
    await this.prisma.advertisement.delete({ where: { id } });
    return true;
  }

  async getStats() {
    const [totalAds, activeAds, aggregate] = await Promise.all([
      this.prisma.advertisement.count(),
      this.prisma.advertisement.count({ where: { isActive: true } }),
      this.prisma.advertisement.aggregate({
        _sum: { clickCount: true, impressionCount: true },
      }),
    ]);

    return {
      totalAds,
      activeAds,
      totalClicks: aggregate._sum.clickCount ?? 0,
      totalImpressions: aggregate._sum.impressionCount ?? 0,
    };
  }
}
