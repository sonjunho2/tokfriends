import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateSudaPostDto } from './dto/suda.dto';

@Injectable()
export class SudaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 1줄 수다 토크 목록 조회
   */
  async listPosts(params: {
    neighborhood?: string;
    page?: number;
    limit?: number;
  }) {
    const { neighborhood, page = 1, limit = 30 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (neighborhood && neighborhood.trim()) {
      where.neighborhood = { contains: neighborhood.trim(), mode: 'insensitive' };
    }

    const [total, items] = await Promise.all([
      this.prisma.sudaPost.count({ where }),
      this.prisma.sudaPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              nickname: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: items.map((p) => ({
        id: p.id,
        content: p.content,
        neighborhood: p.neighborhood,
        latitude: p.latitude,
        longitude: p.longitude,
        likesCount: p.likesCount,
        repliesCount: p.repliesCount,
        createdAt: p.createdAt,
        author: {
          id: p.author.id,
          nickname: p.author.nickname || p.author.displayName || '이웃',
          avatarUrl:
            p.author.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
          trustScore: 99.0,
        },
      })),
    };
  }

  /**
   * 1줄 수다 토크 단건 상세 조회
   */
  async getPost(id: string) {
    const post = await this.prisma.sudaPost.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('수다 글을 찾을 수 없습니다.');
    }

    return {
      id: post.id,
      content: post.content,
      neighborhood: post.neighborhood,
      latitude: post.latitude,
      longitude: post.longitude,
      likesCount: post.likesCount,
      repliesCount: post.repliesCount,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        nickname: post.author.nickname || post.author.displayName || '이웃',
        avatarUrl:
          post.author.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        trustScore: 99.0,
      },
    };
  }

  /**
   * 1줄 수다 토크 작성
   */
  async createPost(authorId: string, dto: CreateSudaPostDto) {
    const post = await this.prisma.sudaPost.create({
      data: {
        authorId,
        content: dto.content.trim(),
        neighborhood: dto.neighborhood.trim(),
        latitude: dto.latitude,
        longitude: dto.longitude,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return {
      id: post.id,
      content: post.content,
      neighborhood: post.neighborhood,
      latitude: post.latitude,
      longitude: post.longitude,
      likesCount: post.likesCount,
      repliesCount: post.repliesCount,
      createdAt: post.createdAt,
      author: {
        id: post.author.id,
        nickname: post.author.nickname || post.author.displayName || '이웃',
        avatarUrl:
          post.author.avatarUrl ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        trustScore: 99.0,
      },
    };
  }

  /**
   * 1줄 수다 토크 공감/좋아요 (+1)
   */
  async likePost(postId: string) {
    const post = await this.prisma.sudaPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('수다 글을 찾을 수 없습니다.');
    }

    const updated = await this.prisma.sudaPost.update({
      where: { id: postId },
      data: {
        likesCount: { increment: 1 },
      },
      select: {
        id: true,
        likesCount: true,
      },
    });

    return updated;
  }

  /**
   * 1줄 수다 토크 삭제
   */
  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.sudaPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('수다 글을 찾을 수 없습니다.');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
    }

    await this.prisma.sudaPost.delete({
      where: { id: postId },
    });

    return { ok: true, deletedId: postId };
  }
}
