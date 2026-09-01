// services/api/src/modules/posts/posts.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        userId,
        topicId: dto.topicId,
        content: dto.content,
      },
      select: {
        id: true,
        userId: true,
        topicId: true,
        content: true,
        createdAt: true,
      },
    });
  }

  async listAll(cursor?: string, take: number = 20) {
    const posts = await this.prisma.post.findMany({
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        topicId: true,
        content: true,
        createdAt: true,
      },
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async listByTopic(topicId: string, cursor?: string, take: number = 20) {
    const posts = await this.prisma.post.findMany({
      where: { topicId },
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        topicId: true,
        content: true,
        createdAt: true,
      },
    });

    const hasMore = posts.length > take;
    const items = posts.slice(0, take);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}
