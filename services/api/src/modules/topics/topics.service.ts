// services/api/src/modules/topics/topics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const topics = await this.prisma.topic.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { posts: true }
        }
      }
    });

    return topics.map(topic => ({
      id: topic.id,
      name: topic.name,
      createdAt: topic.createdAt,
      postsCount: topic._count.posts
    }));
  }
}