import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TranslateService } from './translate.service';

@ApiTags('translate')
@Controller('translate')
export class TranslateController {
  constructor(private readonly svc: TranslateService) {}
  @Post()
  async translate(@Body() dto: { text: string, source: string, target: string }) {
    return this.svc.translate(dto.text, dto.source, dto.target);
  }
}
