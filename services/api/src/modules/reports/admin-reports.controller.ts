// services/api/src/modules/reports/admin-reports.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';

@ApiTags('admin/reports')
@ApiBearerAuth()
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
}
