import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService } from './metrics.service';

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getSummary() {
    return {
      ok: true,
      data: await this.metricsService.getSummary(),
    };
  }

  @Get('dashboard')
  async getDashboard() {
    return {
      ok: true,
      data: await this.metricsService.getDashboard(),
    };
  }
}
