import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  PrepareEscrowPaymentDto,
  ConfirmEscrowPaymentDto,
  CompleteEscrowOrderDto,
  DisputeEscrowOrderDto,
} from './dto/escrow-payment.dto';
import { Public } from '../auth/public.decorator';

@ApiTags('Payments Escrow (실물 커머스 PG 에스크로 결제)')
@Controller(['payments/escrow', 'api/payments/escrow'])
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('prepare')
  @ApiBearerAuth()
  @ApiOperation({ summary: '에스크로 주문 생성 및 PG 결제 승인 요청 준비' })
  async prepareEscrowPayment(@Req() req: any, @Body() dto: PrepareEscrowPaymentDto) {
    const userId = req.user?.id || req.user?.sub || 'user-guest';
    return this.paymentsService.prepareEscrowPayment(userId, dto);
  }

  @Post('confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'PG 결제 완료 검증 및 에스크로 안전 예치(PAID_ESCROW) 전환' })
  async confirmEscrowPayment(@Req() req: any, @Body() dto: ConfirmEscrowPaymentDto) {
    const userId = req.user?.id || req.user?.sub || 'user-guest';
    return this.paymentsService.confirmEscrowPayment(userId, dto);
  }

  @Post('complete-order')
  @ApiBearerAuth()
  @ApiOperation({ summary: '구매자의 [구매 확정] 호출 ➔ 판매자 정산 대기열 생성 및 COMPLETED 전환' })
  async completeOrder(@Req() req: any, @Body() dto: CompleteEscrowOrderDto) {
    const userId = req.user?.id || req.user?.sub || 'user-guest';
    return this.paymentsService.completeOrder(userId, dto);
  }

  @Post('dispute')
  @ApiBearerAuth()
  @ApiOperation({ summary: '분쟁 발생 시 관리자 콘솔 결재 대기열 적재' })
  async disputeOrder(@Req() req: any, @Body() dto: DisputeEscrowOrderDto) {
    const userId = req.user?.id || req.user?.sub || 'user-guest';
    return this.paymentsService.disputeOrder(userId, dto);
  }

  @Public()
  @Get(':orderId')
  @ApiOperation({ summary: '에스크로 주문 상세 조회' })
  async getOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getOrder(orderId);
  }
}
