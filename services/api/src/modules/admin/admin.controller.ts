import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { JwtGuard } from '../../common/jwt.guard';
import { RolesGuard, Roles } from '../../common/roles.guard';

const prisma = new PrismaClient();

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  @Patch('users/:id/role')
  async setRole(@Param('id') id: string, @Body() dto: { role: 'user'|'moderator'|'admin' }) {
    const u = await prisma.user.update({ where: { id }, data: { role: dto.role } });
    await prisma.auditLog.create({ data: { actorId: id, target: 'user:'+id, action: 'SET_ROLE:'+dto.role } });
    return u;
  }

  @Get('refunds')
  async listRefunds() {
    return prisma.refundRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('refunds')
  async createRefund(@Body() dto: { userId: string, platform: string, productId: string, receiptId: string, reason?: string }) {
    return prisma.refundRequest.create({ data: dto as any });
  }

  @Patch('refunds/:id/approve')
  async approve(@Param('id') id: string) {
    return prisma.refundRequest.update({ where: { id }, data: { status: 'approved', decidedAt: new Date() } });
  }

  @Patch('refunds/:id/deny')
  async deny(@Param('id') id: string) {
    return prisma.refundRequest.update({ where: { id }, data: { status: 'denied', decidedAt: new Date() } });
  }
}
