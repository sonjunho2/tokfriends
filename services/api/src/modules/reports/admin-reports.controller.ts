// services/api/src/modules/reports/admin-reports.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { AdminPermissions } from '../../common/admin-permissions.guard';

@ApiTags('admin/reports')
@ApiBearerAuth()
@AdminPermissions('reports.view')
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @ApiQuery({ name: 'status', required: false, type: String, example: 'PENDING' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @Get()
  async list(
    @Query('status') status?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const p = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (p - 1) * take;

    const [total, items] = await this.reports.paginate(status, { skip, take });

    return {
      ok: true,
      page: p,
      limit: take,
      total,
      totalPages: Math.max(1, Math.ceil(total / take)),
      data: items,
      items,
    };
  }

  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @Get('recent')
  async recent(@Query('limit') limit?: string) {
    const n = Number(limit ?? 20) || 20;
    const items = await this.reports.listRecent(n);
    return { ok: true, total: items.length, limit: n, data: items, items };
  }

  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { properties: { status: { type: 'string', enum: ['REVIEWING', 'RESOLVED', 'REJECTED'] } } } })
  @AdminPermissions('reports.view')
  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    if (!['REVIEWING', 'RESOLVED', 'REJECTED'].includes(status?.toUpperCase())) {
      throw new BadRequestException('status must be one of: REVIEWING, RESOLVED, REJECTED');
    }
    const updated = await this.reports.updateStatus(id, status.toUpperCase() as any);
    if (!updated) throw new NotFoundException(`Report ${id} not found`);
    return { ok: true, data: updated };
  }

  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ schema: { properties: { reason: { type: 'string' } } } })
  @AdminPermissions('reports.view')
  @Post(':id/block-user')
  async blockReportedUser(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason?: string,
  ) {
    const result = await this.reports.blockReportedUser(id, reason);
    if (!result) throw new NotFoundException(`Report ${id} not found or has no reported user`);
    return { ok: true, data: result };
  }
}
