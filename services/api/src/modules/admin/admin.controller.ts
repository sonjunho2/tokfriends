import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PrismaClient } from '@prisma/client';
import { RolesGuard, Roles } from '../../common/roles.guard';
import { CreateRefundDto, SetUserRoleDto } from './dto';

const prisma = new PrismaClient();

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  @Patch('users/:id/role')
  async setRole(@Param('id') id: string, @Body() dto: SetUserRoleDto) {
    const u = await prisma.user.update({ where: { id }, data: { role: dto.role } });
    await prisma.auditLog.create({ data: { actorId: id, target: 'user:'+id, action: 'SET_ROLE:'+dto.role } });
    return u;
  }

  @Get('refunds')
  async listRefunds() {
    return prisma.refundRequest.findMany({ orderBy: { createdAt: 'desc' } });
  }

  @Post('refunds')
  async createRefund(@Body() dto: CreateRefundDto) {
    return prisma.refundRequest.create({ data: dto });
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
