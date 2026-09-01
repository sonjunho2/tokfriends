import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { LegalDocumentsService } from './legal-documents.service';

@ApiTags('legal-documents')
@Controller('legal-documents')
export class LegalDocumentsController {
  constructor(private readonly legalDocuments: LegalDocumentsService) {}

  @Public()
  @Get(':slug')
  getDocument(@Param('slug') slug: string) {
    return this.legalDocuments.getBySlug(slug);
  }
}
