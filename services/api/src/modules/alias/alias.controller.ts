// services/api/src/modules/alias/alias.controller.ts
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { StoreService } from '../store/store.service';
import { LegalDocumentsService } from '../legal-documents/legal-documents.service';
import { ConfirmPurchaseDto } from '../store/dto/confirm-purchase.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';

@ApiTags('alias')
@Controller()
export class AliasController {
  constructor(
    private readonly store: StoreService,
    private readonly legalDocuments: LegalDocumentsService,
  ) {}

  // 결제 상품 조회 alias
  @Public()
  @Get(['payments/products', 'shop/points', 'store/products'])
  async listPointProductAliases() {
    const items = await this.store.listPointProducts();
    return { items };
  }

  // 결제 확인 alias
  @ApiBearerAuth()
  @Post('payments/confirm')
  async confirmPaymentAlias(
    @CurrentUser() user: any,
    @Body() dto: ConfirmPurchaseDto,
  ) {
    const userId = user?.sub ?? user?.id;
    return this.store.confirmPointPurchase(userId, dto);
  }

  // 법률 문서 조회 alias
  @Public()
  @Get(['legal/:slug', 'legal-documents/:slug'])
  async getLegalDocumentAlias(@Param('slug') slug: string) {
    return this.legalDocuments.getBySlug(slug);
  }
}
