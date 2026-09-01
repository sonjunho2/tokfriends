// services/api/src/modules/topics/topics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TopicsService } from './topics.service';

@ApiTags('topics')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  async findAll() {
    return this.topicsService.findAll();
  }
}