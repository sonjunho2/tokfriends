// services/api/src/modules/posts/posts.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';

const POST_INCLUDE = {
  user: {
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
      activityAccountBridge: {
        select: {
          id: true,
          handle: true,
          displayName: true,
        },
      },
    },
  },
  topic: {
    select: {
      id: true,
      name: true,
    },
  },
};

function formatPost(post: any) {
  return {
    id: post.id,
    topicId: post.topicId,
    topicName: post.topic?.name || '일반',
    content: post.content,
    createdAt: post.createdAt,
    author: {
      id: post.user.id,
      name:
        post.user.profile?.nickname ||
        post.user.displayName ||
        '회원',
      avatar: post.user.profile?.avatarUri || null,
      region:
        [post.user.region1, post.user.region2].filter(Boolean).join(' · ') ||
        '지역 미설정',
      headline: post.user.profile?.headline || null,
      targetAccountId: post.user.activityAccountBridge?.id || null,
    },
  };
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    let topicId = dto.topicId?.trim();

    if (!topicId) {
      const defaultTopic = await this.prisma.topic.findFirst({
        orderBy: { createdAt: 'asc' },
      });
      if (defaultTopic) {
        topicId = defaultTopic.id;
      } else {
        const created = await this.prisma.topic.create({
          data: { name: '일상 / 수다' },
        });
        topicId = created.id;
      }
    } else {
      const topicExists = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });
      if (!topicExists) {
        const fallback = await this.prisma.topic.findFirst({
          orderBy: { createdAt: 'asc' },
        });
        topicId = fallback?.id || topicId;
      }
    }

    const post = await this.prisma.post.create({
      data: {
        userId,
        topicId,
        content: dto.content.trim(),
      },
      include: POST_INCLUDE,
    });

    return formatPost(post);
  }

  private async getBlockedUserIds(currentUserId?: string): Promise<string[]> {
    if (!currentUserId) return [];
    const blocks = await this.prisma.block.findMany({
      where: {
        OR: [{ userId: currentUserId }, { blockedUserId: currentUserId }],
      },
      select: { userId: true, blockedUserId: true },
    });
    return blocks.map((b) =>
      b.userId === currentUserId ? b.blockedUserId : b.userId,
    );
  }

  async listAll(currentUserId?: string, cursor?: string, take: number = 20) {
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);

    const where: any = {};
    if (blockedUserIds.length > 0) {
      where.userId = { notIn: blockedUserIds };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE,
    });

    const hasMore = posts.length > take;
    const rawItems = posts.slice(0, take);
    const items = rawItems.map(formatPost);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async listByTopic(
    topicId: string,
    currentUserId?: string,
    cursor?: string,
    take: number = 20,
  ) {
    const blockedUserIds = await this.getBlockedUserIds(currentUserId);

    const where: any = { topicId };
    if (blockedUserIds.length > 0) {
      where.userId = { notIn: blockedUserIds };
    }

    const posts = await this.prisma.post.findMany({
      where,
      take: take + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: POST_INCLUDE,
    });

    const hasMore = posts.length > take;
    const rawItems = posts.slice(0, take);
    const items = rawItems.map(formatPost);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return {
      items,
      nextCursor,
      hasMore,
    };
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.userId !== userId) {
      throw new ForbiddenException('게시글을 삭제할 권한이 없습니다.');
    }

    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { success: true };
  }
}
