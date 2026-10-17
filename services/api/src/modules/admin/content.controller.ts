import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { ContentService } from './content.service';
import { PrismaService } from 'nestjs-prisma';

@Controller()
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // Public Announcements (Mobile App Client)
  // ==========================================
  @Public()
  @Get('announcements')
  async getAnnouncements(
    @Query('isActive') isActive?: string,
    @Query('audience') audience?: string,
  ) {
    const list = this.contentService.getAnnouncements({ isActive, audience });
    return { ok: true, announcements: list, data: list };
  }

  @Public()
  @Get('announcements/active')
  async getActiveAnnouncements() {
    const list = this.contentService.getActiveAnnouncements();
    return { ok: true, announcements: list, data: list };
  }

  // ==========================================
  // Admin Announcements
  // ==========================================
  @Get('admin/announcements')
  async getAdminAnnouncements() {
    const list = this.contentService.getAnnouncements();
    return { ok: true, data: list, announcements: list };
  }

  @Post('admin/announcements')
  async createAnnouncement(
    @CurrentUser() actor: any,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const item = this.contentService.createAnnouncement(dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `announcement:${item.id}`,
          action: 'ANNOUNCEMENT_CREATED',
          notes: `title=${item.title};audience=${item.audience};status=${item.status}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: item };
  }

  @Patch('admin/announcements/:id')
  async updateAnnouncement(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const updated = this.contentService.updateAnnouncement(id, dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `announcement:${id}`,
          action: 'ANNOUNCEMENT_UPDATED',
          notes: `status=${updated?.status};isActive=${updated?.isActive}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: updated };
  }

  @Delete('admin/announcements/:id')
  async deleteAnnouncement(
    @CurrentUser() actor: any,
    @Param('id') id: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const result = this.contentService.deleteAnnouncement(id);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `announcement:${id}`,
          action: 'ANNOUNCEMENT_DELETED',
          notes: `id=${id}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: result };
  }

  // ==========================================
  // Admin Community Posts
  // ==========================================
  @Get('admin/posts/stats')
  async getPostStats() {
    const stats = this.contentService.getPostStats();
    return { ok: true, data: stats };
  }

  @Get('admin/posts')
  async getAdminPosts(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('isPinned') isPinned?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const res = this.contentService.getPosts({
      status,
      category,
      search,
      isPinned,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { ok: true, ...res, data: res.items, posts: res.items };
  }

  @Get('admin/posts/:id')
  async getAdminPostById(@Param('id') id: string) {
    const post = this.contentService.getPostById(id);
    return { ok: true, data: post };
  }

  @Post('admin/posts')
  async createAdminPost(
    @CurrentUser() actor: any,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const item = this.contentService.createPost({
      ...dto,
      authorId: actorId || 'admin-official',
      authorRole: 'ADMIN',
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `post:${item.id}`,
          action: 'COMMUNITY_POST_CREATED',
          notes: `category=${item.category};isPinned=${item.isPinned};title=${item.title}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: item };
  }

  @Patch('admin/posts/:id/status')
  async updatePostStatus(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() dto: { status?: any; hiddenReason?: string; isPinned?: boolean },
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const updated = this.contentService.updatePostStatus(id, dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `post:${id}`,
          action: 'COMMUNITY_POST_STATUS_CHANGED',
          notes: `status=${dto.status};isPinned=${dto.isPinned};reason=${dto.hiddenReason}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: updated };
  }

  @Delete('admin/posts/:id')
  async deleteAdminPost(
    @CurrentUser() actor: any,
    @Param('id') id: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const result = this.contentService.deletePost(id);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `post:${id}`,
          action: 'COMMUNITY_POST_FORCE_DELETED',
          notes: `id=${id}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: result };
  }

  @Delete('admin/posts/:id/comments/:commentId')
  async deletePostComment(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const result = this.contentService.deleteComment(id, commentId);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `post:${id}:comment:${commentId}`,
          action: 'POST_COMMENT_DELETED',
          notes: `postId=${id};commentId=${commentId}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: result };
  }

  // ==========================================
  // Admin FAQs
  // ==========================================
  @Get('admin/faqs')
  async getFaqs() {
    const list = this.contentService.getFaqs();
    return { ok: true, data: list, faqs: list };
  }

  @Post('admin/faqs')
  async createFaq(
    @CurrentUser() actor: any,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const item = this.contentService.createFaq(dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `faq:${item.id}`,
          action: 'FAQ_CREATED',
          notes: `question=${item.question}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: item };
  }

  @Patch('admin/faqs/:id')
  async updateFaq(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const updated = this.contentService.updateFaq(id, dto);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `faq:${id}`,
          action: 'FAQ_UPDATED',
          notes: `id=${id}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: updated };
  }

  @Delete('admin/faqs/:id')
  async deleteFaq(
    @CurrentUser() actor: any,
    @Param('id') id: string,
  ) {
    const actorId = actor?.id ?? actor?.sub;
    const result = this.contentService.deleteFaq(id);

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          target: `faq:${id}`,
          action: 'FAQ_DELETED',
          notes: `id=${id}`,
        },
      })
      .catch(() => null);

    return { ok: true, data: result };
  }

  // ==========================================
  // Legacy / Public Endpoints Compatibility
  // ==========================================
  @Public()
  @Get('posts')
  async getPublicPosts(@Query() query: any) {
    const res = this.contentService.getPosts({
      ...query,
      status: query.status || 'ACTIVE',
    });
    return { ok: true, posts: res.items, data: res.items };
  }

  @Patch('posts/:id')
  async updateLegacyPost(@Param('id') id: string, @Body() dto: any) {
    const updated = this.contentService.updatePostStatus(id, dto);
    return { ok: true, data: updated };
  }

  @Delete('posts/:id')
  async deleteLegacyPost(@Param('id') id: string) {
    const res = this.contentService.deletePost(id);
    return { ok: true, data: res };
  }
}
