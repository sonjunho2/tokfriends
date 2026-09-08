import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles, RolesGuard } from '../../common/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { UpdateLegalDocumentDto } from './dto/update-legal-document.dto';
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

  @Put(':slug')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin')
  updateDocument(
    @CurrentUser() user: any,
    @Param('slug') slug: string,
    @Body() dto: UpdateLegalDocumentDto,
  ) {
    const actorId = user?.id ?? user?.sub;
    return this.legalDocuments.updateBySlug(actorId, slug, dto);
  }
}