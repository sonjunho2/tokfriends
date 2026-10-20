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
  // Public & Mobile FAQs
  // ==========================================
  @Public()
  @Get(['community/faqs', 'faqs'])
  async getPublicFaqs() {
    const list = this.contentService.getFaqs();
    return { ok: true, data: list, faqs: list, items: list };
  }

  // ==========================================
  // 1:1 Support Tickets (고객센터 문의 접수 & 관리)
  // ==========================================
  @Public()
  @Get(['admin/support-tickets', 'support/tickets'])
  async getSupportTickets() {
    const list = this.contentService.getSupportTickets();
    return { ok: true, data: list, tickets: list, items: list };
  }

  @Public()
  @Post(['community/support-tickets', 'support/inquiries', 'support/tickets'])
  async createSupportTicket(
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const ticket = this.contentService.createSupportTicket({
      ...dto,
      userId: user?.id || user?.sub || dto.userId,
    });
    return {
      ok: true,
      success: true,
      data: ticket,
      ticket,
      message: '1:1 고객 문의가 성공적으로 접수되었습니다. 담당자가 확인 후 신속히 안내드리겠습니다.',
    };
  }

  @Public()
  @Patch('admin/support-tickets/:id/status')
  async updateSupportTicketStatus(
    @Param('id') id: string,
    @Body() body: { status: '대기' | '진행' | '완료' },
  ) {
    const result = this.contentService.updateSupportTicketStatus(id, body.status);
    return result;
  }

  // ==========================================
  // Legacy / Public Endpoints Compatibility
  // ==========================================
  // ==========================================
  // Public & Mobile Community Endpoints
  // ==========================================
  @Public()
  @Get('posts')
  async getPublicPosts(@Query() query: any) {
    const res = this.contentService.getPosts({
      ...query,
      status: query.status || 'ACTIVE',
    });
    return { ok: true, posts: res.items, data: res.items, items: res.items };
  }

  @Public()
  @Get(['posts/topics', 'topics'])
  async getTopics() {
    const topics = this.contentService.getTopics();
    return { ok: true, data: topics, topics };
  }

  @Public()
  @Get('posts/:id')
  async getPublicPostById(@Param('id') id: string) {
    const post = this.contentService.getPostById(id);
    return { ok: true, data: post, post };
  }

  @Public()
  @Post('posts')
  async createCommunityPost(@CurrentUser() user: any, @Body() dto: any) {
    const userId = user?.id || user?.sub || 'usr_guest';
    const nickname = user?.nickname || user?.displayName || dto?.authorNickname || '동네 이웃';
    const avatar = user?.avatarUrl || dto?.authorAvatarUrl || null;
    const item = this.contentService.createPost({
      ...dto,
      authorId: userId,
      authorNickname: nickname,
      authorDisplayName: nickname,
      authorAvatarUrl: avatar,
      authorRole: 'USER',
      category: dto.category || 'DAILY',
    });
    return { ok: true, data: item, post: item };
  }

  @Public()
  @Post('posts/:id/like')
  async toggleLikePost(@Param('id') id: string) {
    const res = this.contentService.toggleLikePost(id);
    return res;
  }

  @Public()
  @Get('posts/:id/comments')
  async getPostComments(@Param('id') id: string) {
    const comments = this.contentService.getComments(id);
    return { ok: true, data: comments, comments, items: comments };
  }

  @Public()
  @Post('posts/:id/comments')
  async createPostComment(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: any,
  ) {
    const userId = user?.id || user?.sub || 'usr_guest';
    const nickname = user?.nickname || user?.displayName || '이웃';
    const avatar = user?.avatarUrl || null;
    const comment = this.contentService.addComment(id, {
      authorId: userId,
      authorNickname: nickname,
      authorAvatarUrl: avatar,
      content: dto?.content || '',
    });
    return { ok: true, data: comment, comment };
  }

  @Public()
  @Delete('posts/:id/comments/:commentId')
  async deleteCommunityComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
  ) {
    const res = this.contentService.deleteComment(id, commentId);
    return res;
  }

  @Public()
  @Delete('posts/:id')
  async deletePublicPost(@Param('id') id: string) {
    const res = this.contentService.deletePost(id);
    return { ok: true, data: res };
  }

  // ==========================================
  // Reports (모바일 신고 & 관리자 센터 엔드투엔드 연동)
  // ==========================================
  @Public()
  @Post(['community/report', 'reports'])
  async reportContent(@CurrentUser() user: any, @Body() body: any) {
    const res = this.contentService.createReport(user, body);
    return res;
  }

  @Public()
  @Get('admin/reports')
  async getAdminReports(@Query() query: any) {
    const res = this.contentService.getReports(query);
    return res;
  }

  @Public()
  @Get('admin/reports/stats')
  async getAdminReportStats() {
    const stats = this.contentService.getReportStats();
    return { ok: true, data: stats, ...stats };
  }

  @Public()
  @Patch('admin/reports/:id/status')
  async updateAdminReportStatus(
    @Param('id') id: string,
    @Body() body: { status: any; memo?: string },
  ) {
    const updated = this.contentService.updateReportStatus(id, body.status, body.memo);
    return { ok: true, data: updated, ...updated };
  }

  @Public()
  @Post('admin/reports/:id/block-user')
  async blockReportedUser(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const res = this.contentService.blockReportedUser(id, body?.reason);
    return { ok: true, data: res, ...res };
  }

  @Public()
  @Post(['admin/reports/:id/sanction', 'admin/reports/:id/sanction-user'])
  async sanctionReportedUser(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const res = this.contentService.sanctionReportedUser(id, body);
    return { ok: true, data: res, ...res };
  }

  @Public()
  @Delete('admin/reports/:id/post')
  async deleteReportedPost(@Param('id') id: string) {
    const res = this.contentService.deleteReportedPost(id);
    return res;
  }
}
