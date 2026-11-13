import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateSudaPostDto } from './dto/suda.dto';
import { ChatGateway } from '../ws/chat.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SudaService {
  private readonly dataDir = path.resolve(process.cwd(), 'data');
  private readonly sudaFilePath = path.join(this.dataDir, 'suda-posts.json');
  private inMemoryPosts: any[] = [];

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.sudaFilePath)) {
        const raw = fs.readFileSync(this.sudaFilePath, 'utf-8');
        this.inMemoryPosts = JSON.parse(raw);
      }
    } catch {
      this.inMemoryPosts = [];
    }
  }

  private saveToDisk() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      fs.writeFileSync(this.sudaFilePath, JSON.stringify(this.inMemoryPosts, null, 2), 'utf-8');
    } catch {}
  }

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

    let dbItems: any[] = [];
    let dbTotal = 0;

    const where: any = {};
    if (neighborhood && neighborhood.trim()) {
      where.neighborhood = { contains: neighborhood.trim(), mode: 'insensitive' };
    }

    try {
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
      dbTotal = total;
      dbItems = (items || []).map((p) => ({
        id: p.id,
        title: (p as any).title || p.content,
        content: p.content,
        neighborhood: p.neighborhood,
        entryFee: Number((p as any).entryFee || 0),
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
      }));
    } catch (err) {
      console.warn('[SudaService] DB query notice, using seed posts:', (err as any)?.message);
    }

    // Merge in-memory/disk posts (newest first)
    const combined = [...this.inMemoryPosts, ...dbItems];
    const uniqueMap = new Map<string, any>();
    combined.forEach((item) => {
      if (!uniqueMap.has(item.id)) {
        uniqueMap.set(item.id, item);
      }
    });

    const seedPosts = [
      {
        id: 'suda-sua',
        title: '양재천 산책 커피 타임 ☕',
        content: '선선해서 양재천 산책하기 딱 좋은 날씨네요! 같이 가벼운 커피 한잔 하실 이웃 계실까요? ☕🌿',
        neighborhood: '역삼1동',
        entryFee: 0,
        category: '일상',
        latitude: 37.5006,
        longitude: 127.0365,
        likesCount: 14,
        repliesCount: 6,
        createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        author: {
          id: 'user-suda-1',
          nickname: '수아',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
          trustScore: 99.2,
        },
      },
      {
        id: 'suda-dohyun',
        title: '야식 메뉴 골라주세요 🍗',
        content: '오늘 야식 메뉴 고민인데 치킨 vs 매운 떡볶이 골라주세요! 추천해주시면 감사해요 🍗🔥',
        neighborhood: '역삼2동',
        entryFee: 100,
        category: '동네질문',
        latitude: 37.4912,
        longitude: 127.0234,
        likesCount: 22,
        repliesCount: 15,
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        author: {
          id: 'user-suda-2',
          nickname: '도현',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
          trustScore: 97.5,
        },
      },
      {
        id: 'suda-yujin',
        title: '매봉산 강아지 산책로 🐶',
        content: '강아지랑 매봉산 둘레길 가려고 하는데 오늘 산책로 상태 괜찮은가요? 댕댕이 친구 환영! 🐶',
        neighborhood: '도곡동',
        entryFee: 200,
        category: '반려동물',
        latitude: 37.4882,
        longitude: 127.0421,
        likesCount: 9,
        repliesCount: 4,
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        author: {
          id: 'user-suda-3',
          nickname: '유진',
          avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
          trustScore: 98.8,
        },
      },
      {
        id: 'suda-jiwoo',
        title: '퇴근길 예쁜 노을 사진 🌇',
        content: '퇴근길에 예쁜 노을 사진 찍었어요 🌇 다들 오늘 하루도 고생 많으셨습니다 화이팅!',
        neighborhood: '논현1동',
        entryFee: 0,
        category: '취미',
        latitude: 37.5112,
        longitude: 127.0289,
        likesCount: 31,
        repliesCount: 8,
        createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        author: {
          id: 'user-suda-4',
          nickname: '지우',
          avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300',
          trustScore: 96.0,
        },
      },
      {
        id: 'suda-jisoo',
        title: '오늘 저녁 한강공원 산책 🌿',
        content: '오늘 날씨가 너무 좋아서 한강공원 산책 나왔어요 🌿 산책이나 피크닉 좋아하시는 동네 친구 계신가요?',
        neighborhood: '역삼1동',
        entryFee: 0,
        category: '일상',
        latitude: 37.5006,
        longitude: 127.0365,
        likesCount: 15,
        repliesCount: 2,
        createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        author: {
          id: 'u101',
          nickname: '이지수',
          avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
          trustScore: 99.2,
        },
      },
    ];

    seedPosts.forEach((s) => {
      if (!uniqueMap.has(s.id)) {
        uniqueMap.set(s.id, s);
      }
    });

    const allItems = Array.from(uniqueMap.values());
    const filtered = neighborhood && neighborhood.trim()
      ? allItems.filter((p) => p.neighborhood?.includes(neighborhood.trim()))
      : allItems;

    return {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      items: filtered.slice(skip, skip + limit),
    };
  }

  /**
   * 1줄 수다 토크 단건 상세 조회
   */
  async getPost(id: string) {
    try {
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

      if (post) {
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
    } catch {}

    const list = await this.listPosts({});
    const fallback = list.items.find((p) => p.id === id);
    if (fallback) return fallback;

    throw new NotFoundException('수다 글을 찾을 수 없습니다.');
  }

  /**
   * 1줄 수다 토크 작성
   */
  async createPost(authorId: string, dto: CreateSudaPostDto) {
    let authorName = '나 (이웃)';
    let authorAvatar: string | null = null;

    if (authorId && authorId !== 'usr_guest') {
      try {
        const u = await this.prisma.user.findUnique({
          where: { id: authorId },
          select: { nickname: true, displayName: true, avatarUrl: true },
        });
        if (u) {
          authorName = u.nickname || u.displayName || authorName;
          authorAvatar = u.avatarUrl || null;
        }
      } catch {}
    }

    const postItem = {
      id: `suda-post-${Date.now()}`,
      title: dto.title?.trim() || dto.content.trim(),
      content: dto.content.trim(),
      neighborhood: dto.neighborhood.trim(),
      entryFee: Math.max(0, Number(dto.entryFee || 0)),
      latitude: dto.latitude || 37.5006,
      longitude: dto.longitude || 127.0365,
      likesCount: 0,
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      author: {
        id: authorId || 'usr_guest',
        nickname: authorName,
        avatarUrl:
          authorAvatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        trustScore: 99.0,
      },
    };

    // Try DB insertion if available
    try {
      await this.prisma.sudaPost.create({
        data: {
          authorId: authorId || 'usr_guest',
          content: dto.content.trim(),
          neighborhood: dto.neighborhood.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
        },
      });
    } catch (err) {
      console.warn('[SudaService] DB create notice, using resilient store:', (err as any)?.message);
    }

    this.inMemoryPosts.unshift(postItem);
    this.saveToDisk();

    // Broadcast over WebSocket to all connected clients!
    this.chatGateway.emitSudaPost(postItem);

    return postItem;
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
   * 1줄 수다 토크 삭제 (DB 및 인메모리 영구 삭제 + 실시간 소켓 브로드캐스트)
   */
  async deletePost(userId: string, postId: string) {
    try {
      const post = await this.prisma.sudaPost.findUnique({
        where: { id: postId },
      });
      if (post) {
        if (userId && userId !== 'guest' && post.authorId !== userId) {
          throw new ForbiddenException('본인의 글만 삭제할 수 있습니다.');
        }
        await this.prisma.sudaPost.delete({ where: { id: postId } });
      }
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
    }

    this.inMemoryPosts = this.inMemoryPosts.filter((p) => p.id !== postId);
    this.saveToDisk();

    try {
      this.chatGateway.emitSudaDelete(postId);
    } catch {}

    return { ok: true, deletedId: postId };
  }
}
