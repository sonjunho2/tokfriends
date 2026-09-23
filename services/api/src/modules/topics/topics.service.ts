// services/api/src/modules/topics/topics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

const DEFAULT_TOPICS = [
  '일상 / 수다',
  '동네 친구',
  '취미 / 운동',
  '고민 상담',
  '맛집 탐방',
];

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    let topics = await this.prisma.topic.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (topics.length === 0) {
      for (const name of DEFAULT_TOPICS) {
        await this.prisma.topic.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }

      topics = await this.prisma.topic.findMany({
        orderBy: { createdAt: 'asc' },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      });
    }

    return topics.map((topic) => ({
      id: topic.id,
      name: topic.name,
      createdAt: topic.createdAt,
      postsCount: topic._count.posts,
    }));
  }
}