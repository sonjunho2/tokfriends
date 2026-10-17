import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiManagerService } from './api-manager.service';

@Controller('admin/api-manager')
export class ApiManagerController {
  constructor(private readonly apiManagerService: ApiManagerService) {}

  @Get('snapshot')
  getSnapshot() {
    return this.apiManagerService.getSnapshot();
  }

  @Patch('endpoints/:id')
  updateEndpoint(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.apiManagerService.updateEndpoint(id, body);
  }

  @Post('endpoints/:id/ping')
  pingEndpoint(@Param('id') id: string) {
    return this.apiManagerService.pingEndpoint(id);
  }

  @Post('endpoints')
  createEndpoint(@Body() body: Record<string, unknown>) {
    return this.apiManagerService.createEndpoint(body);
  }

  @Delete('endpoints/:id')
  deleteEndpoint(@Param('id') id: string) {
    return this.apiManagerService.deleteEndpoint(id);
  }
}
