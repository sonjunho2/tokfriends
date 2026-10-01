// services/api/src/modules/posts/posts.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreatePostDto } from './dto/create-post.dto';

function getPostInclude(currentUserId?: string) {
  return {
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
    _count: {
      select: {
        comments: true,
        likes: true,
      },
    },
    likes: currentUserId
      ? {
          where: { userId: currentUserId },
          select: { id: true },
        }
      : false,
  };
}

const COMMENT_INCLUDE = {
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
};

function formatComment(comment: any) {
  return {
    id: comment.id,
    postId: comment.postId,
    content: comment.content,
    createdAt: comment.createdAt,
    author: {
      id: comment.user.id,
      name:
        comment.user.profile?.nickname ||
        comment.user.displayName ||
        '회원',
      avatar: comment.user.profile?.avatarUri || null,
      region:
        [comment.user.region1, comment.user.region2].filter(Boolean).join(' · ') ||
        '지역 미설정',
      headline: comment.user.profile?.headline || null,
      targetAccountId: comment.user.activityAccountBridge?.id || null,
    },
  };
}

function formatPost(post: any) {
  const isLiked = Boolean(Array.isArray(post.likes) && post.likes.length > 0);
  const likesCount =
    typeof post._count?.likes === 'number'
      ? post._count.likes
      : typeof post.likesCount === 'number'
      ? post.likesCount
      : 0;

  return {
    id: post.id,
    topicId: post.topicId,
    topicName: post.topic?.name || '일반',
    content: post.content,
    mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
    createdAt: post.createdAt,
    commentsCount: post._count?.comments ?? 0,
    likesCount,
    isLiked,
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

    const mediaUrls = Array.isArray(dto.mediaUrls)
      ? dto.mediaUrls.filter((u) => typeof u === 'string' && u.trim().length > 0)
      : [];

    const post = await this.prisma.post.create({
      data: {
        userId,
        topicId,
        content: dto.content.trim(),
        mediaUrls,
      },
      include: getPostInclude(userId),
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
      include: getPostInclude(currentUserId),
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
      include: getPostInclude(currentUserId),
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

  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, likesCount: true },
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const existing = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({
          where: { id: existing.id },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      const updatedCount = await this.prisma.postLike.count({
        where: { postId },
      });

      return {
        isLiked: false,
        likesCount: updatedCount,
      };
    } else {
      await this.prisma.$transaction([
        this.prisma.postLike.create({
          data: {
            postId,
            userId,
          },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: {
            likesCount: {
              increment: 1,
            },
          },
        }),
      ]);

      const updatedCount = await this.prisma.postLike.count({
        where: { postId },
      });

      return {
        isLiked: true,
        likesCount: updatedCount,
      };
    }
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

  async listComments(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const blockedUserIds = await this.getBlockedUserIds(currentUserId);
    const where: any = { postId };
    if (blockedUserIds.length > 0) {
      where.userId = { notIn: blockedUserIds };
    }

    const comments = await this.prisma.postComment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: COMMENT_INCLUDE,
    });

    return comments.map(formatComment);
  }

  async createComment(userId: string, postId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    const comment = await this.prisma.postComment.create({
      data: {
        userId,
        postId,
        content: content.trim(),
      },
      include: COMMENT_INCLUDE,
    });

    return formatComment(comment);
  }

  async deleteComment(userId: string, postId: string, commentId: string) {
    const comment = await this.prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });
    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.postId !== postId) {
      throw new NotFoundException('해당 게시글의 댓글이 아닙니다.');
    }

    if (comment.userId !== userId && comment.post.userId !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.prisma.postComment.delete({
      where: { id: commentId },
    });

    return { success: true };
  }
}
