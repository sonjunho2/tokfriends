import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Post('metrics')
  async createMetric(@Body() body: Record<string, unknown>) {
    return this.analyticsService.createMetric(body);
  }

  @Patch('metrics/:id')
  async updateMetric(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.analyticsService.updateMetric(id, body);
  }

  @Get('report-jobs')
  async getReportJobs() {
    return this.analyticsService.getReportJobs();
  }

  @Patch('report-jobs/:id')
  async updateReportJob(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.analyticsService.updateReportJob(id, body);
  }

  @Post('report-jobs/:id/:action')
  async toggleReportJob(@Param('id') id: string, @Param('action') action: string) {
    if (action === 'trigger') {
      return this.analyticsService.triggerReportJob(id);
    }
    const active = action === 'activate';
    return this.analyticsService.toggleReportJob(id, active);
  }

  @Post('exports')
  async createExport(@Body() body: { title?: string; dimension?: string; format?: string; note?: string }) {
    return this.analyticsService.createExport(body);
  }

  @Get('cohort')
  getCohort() {
    return {
      cohorts: this.analyticsService.getCohortData(),
    };
  }

  @Get('funnel')
  getFunnel() {
    return {
      funnel: this.analyticsService.getFunnelData(),
    };
  }

  @Get('traffic')
  getTraffic() {
    return {
      hourly: this.analyticsService.getHourlyTraffic(),
    };
  }
}
