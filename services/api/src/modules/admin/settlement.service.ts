import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from 'nestjs-prisma';

export interface SettlementRequest {
  id: string;
  activityAccountId: string;
  pointsAmount: number;
  krwAmount: number;
  taxAmount: number;
  netAmount: number;
  exchangeRate: number; // 1온 당 지급 원화 (루키 60, 베스트 70, 파트너 80)
  tier: 'ROOKIE' | 'BEST' | 'PARTNER';
  platformFeeKrw: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminMemo?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  activityAccount?: {
    id: string;
    displayName: string;
    handle: string;
    owner?: {
      legacyUser?: {
        id: string;
        email: string;
        displayName: string;
        streamerTier: 'ROOKIE' | 'BEST' | 'PARTNER';
      };
    };
  };
}

export interface RefundRequest {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
    pointsBalance?: number;
  };
  platform: 'google' | 'apple';
  productId: string;
  receiptId: string;
  amountKrw: number;
  points: number;
  reason?: string;
  status: 'pending' | 'approved' | 'denied';
  createdAt: string;
  decidedAt?: string;
}

export interface PointPurchase {
  id: string;
  userId: string;
  user: {
    id: string;
    displayName: string;
    email: string;
  };
  platform: string;
  productId: string;
  productName?: string;
  transactionId: string;
  amountKrw: number;
  points: number;
  status: string;
  createdAt: string;
}

export interface WalletLedger {
  id: string;
  walletId: string;
  kind: string;
  source: string;
  deltaSpendable: number;
  deltaRedeemable: number;
  deltaPending: number;
  spendableAfter: number;
  redeemableAfter: number;
  pendingAfter: number;
  idempotencyKey: string;
  createdAt: string;
  wallet: {
    id: string;
    activityAccountId: string;
    activityAccount: {
      displayName: string;
      handle: string;
    };
  };
}

const INITIAL_SETTLEMENT_REQUESTS: SettlementRequest[] = [
  {
    id: 'set-20261015-001',
    activityAccountId: 'act-host-1',
    pointsAmount: 50000,
    exchangeRate: 70,
    tier: 'BEST',
    krwAmount: 3500000,
    platformFeeKrw: 1500000, // 50,000 * 100 - 3,500,000
    taxAmount: 115500, // 3.3%
    netAmount: 3384500,
    bankName: '국민은행',
    accountNumber: '479001-04-129481',
    accountHolder: '박서아',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    activityAccount: {
      id: 'act-host-1',
      displayName: '박서아 (인기 호스트)',
      handle: 'seoa_live',
      owner: {
        legacyUser: {
          id: 'u-host-1',
          email: 'seoa.park@example.com',
          displayName: '박서아',
          streamerTier: 'BEST',
        },
      },
    },
  },
  {
    id: 'set-20261014-002',
    activityAccountId: 'act-host-2',
    pointsAmount: 20000,
    exchangeRate: 60,
    tier: 'ROOKIE',
    krwAmount: 1200000,
    platformFeeKrw: 800000,
    taxAmount: 39600,
    netAmount: 1160400,
    bankName: '신한은행',
    accountNumber: '110-384-918274',
    accountHolder: '최유나',
    status: 'APPROVED',
    adminMemo: '신한은행 계좌 정상 입금 확인 완료 (이체번호: 20261014-991)',
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    activityAccount: {
      id: 'act-host-2',
      displayName: '최유나',
      handle: 'yuna_choi',
      owner: {
        legacyUser: {
          id: 'u-host-2',
          email: 'yuna.choi@example.com',
          displayName: '최유나',
          streamerTier: 'ROOKIE',
        },
      },
    },
  },
  {
    id: 'set-20261013-003',
    activityAccountId: 'act-host-3',
    pointsAmount: 100000,
    exchangeRate: 80,
    tier: 'PARTNER',
    krwAmount: 8000000,
    platformFeeKrw: 2000000,
    taxAmount: 264000,
    netAmount: 7736000,
    bankName: '카카오뱅크',
    accountNumber: '3333-01-9283741',
    accountHolder: '이소희',
    status: 'APPROVED',
    adminMemo: 'VIP 파트너 크리에이터 정산 완료',
    createdAt: new Date(Date.now() - 3600000 * 52).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    activityAccount: {
      id: 'act-host-3',
      displayName: '이소희 💎',
      handle: 'sohee_vip',
      owner: {
        legacyUser: {
          id: 'u-host-3',
          email: 'sohee.lee@example.com',
          displayName: '이소희',
          streamerTier: 'PARTNER',
        },
      },
    },
  },
];

const INITIAL_REFUND_REQUESTS: RefundRequest[] = [
  {
    id: 'ref-20261015-01',
    userId: 'u-user-1',
    user: {
      id: 'u-user-1',
      displayName: '김철수',
      email: 'chulsoo.kim@example.com',
      pointsBalance: 12500,
    },
    platform: 'google',
    productId: 'com.tokfriends.point.10000',
    receiptId: 'GPA.3391-4820-1928-48192',
    amountKrw: 11000,
    points: 10000,
    reason: '실수로 잘못 결제했습니다. 충전된 온(ON) 코인을 아직 전혀 사용하지 않았습니다.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'ref-20261014-02',
    userId: 'u-user-2',
    user: {
      id: 'u-user-2',
      displayName: '정우성',
      email: 'woosung.jung@example.com',
      pointsBalance: 5000,
    },
    platform: 'apple',
    productId: 'tokfriends.point.5000',
    receiptId: 'APL_REC_9812749182',
    amountKrw: 5500,
    points: 5000,
    reason: '앱 내 결제 테스트 건 (즉시 취소 요청)',
    status: 'approved',
    createdAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    decidedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
  },
];

const INITIAL_PURCHASES: PointPurchase[] = [
  {
    id: 'pur-001',
    userId: 'u-user-1',
    user: { id: 'u-user-1', displayName: '김철수', email: 'chulsoo.kim@example.com' },
    platform: 'android',
    productId: 'com.tokfriends.point.10000',
    productName: '10,000 온 충전',
    transactionId: 'GPA.3391-4820-1928-48192',
    amountKrw: 11000,
    points: 10000,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'pur-002',
    userId: 'u-host-1',
    user: { id: 'u-host-1', displayName: '박서아', email: 'seoa.park@example.com' },
    platform: 'ios',
    productId: 'tokfriends.point.30000',
    productName: '30,000 온 충전 (보너스 +10%)',
    transactionId: 'APL_TX_848201923',
    amountKrw: 33000,
    points: 33000,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'pur-003',
    userId: 'u-user-3',
    user: { id: 'u-user-3', displayName: '이지민', email: 'jimin.lee@example.com' },
    platform: 'android',
    productId: 'com.tokfriends.point.5000',
    productName: '5,000 온 충전 (인기)',
    transactionId: 'GPA.8271-9381-0192-38471',
    amountKrw: 5500,
    points: 5000,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 25).toISOString(),
  },
  {
    id: 'pur-004',
    userId: 'u-user-4',
    user: { id: 'u-user-4', displayName: '강태양', email: 'taeyang.kang@example.com' },
    platform: 'web',
    productId: 'com.tokfriends.point.50000',
    productName: '50,000 온 충전 (대용량)',
    transactionId: 'TOSS_PAY_2026101309812',
    amountKrw: 55000,
    points: 50000,
    status: 'COMPLETED',
    createdAt: new Date(Date.now() - 3600000 * 40).toISOString(),
  },
];

const INITIAL_LEDGER: WalletLedger[] = [
  {
    id: 'led-001',
    walletId: 'wal-user-1',
    kind: 'CHARGE',
    source: 'GOOGLE_IAP',
    deltaSpendable: 10000,
    deltaRedeemable: 0,
    deltaPending: 0,
    spendableAfter: 34000,
    redeemableAfter: 0,
    pendingAfter: 0,
    idempotencyKey: 'idem-chg-20261015-01',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    wallet: {
      id: 'wal-user-1',
      activityAccountId: 'act-user-1',
      activityAccount: {
        displayName: '김철수',
        handle: 'chulsoo',
      },
    },
  },
  {
    id: 'led-002',
    walletId: 'wal-user-1',
    kind: 'GIFT_SEND',
    source: 'LIVE_STREAM',
    deltaSpendable: -1000,
    deltaRedeemable: 0,
    deltaPending: 0,
    spendableAfter: 33000,
    redeemableAfter: 0,
    pendingAfter: 0,
    idempotencyKey: 'idem-gft-20261015-02',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    wallet: {
      id: 'wal-user-1',
      activityAccountId: 'act-user-1',
      activityAccount: {
        displayName: '김철수',
        handle: 'chulsoo',
      },
    },
  },
  {
    id: 'led-003',
    walletId: 'wal-host-1',
    kind: 'GIFT_RECEIVE',
    source: 'LIVE_STREAM',
    deltaSpendable: 0,
    deltaRedeemable: 1000,
    deltaPending: 0,
    spendableAfter: 15000,
    redeemableAfter: 480000,
    pendingAfter: 50000,
    idempotencyKey: 'idem-gft-20261015-03',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    wallet: {
      id: 'wal-host-1',
      activityAccountId: 'act-host-1',
      activityAccount: {
        displayName: '박서아 (인기 호스트)',
        handle: 'seoa_live',
      },
    },
  },
  {
    id: 'led-004',
    walletId: 'wal-host-1',
    kind: 'SETTLEMENT_REQUEST',
    source: 'PAYOUT_SYSTEM',
    deltaSpendable: 0,
    deltaRedeemable: -50000,
    deltaPending: 50000,
    spendableAfter: 15000,
    redeemableAfter: 430000,
    pendingAfter: 50000,
    idempotencyKey: 'idem-set-20261015-04',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    wallet: {
      id: 'wal-host-1',
      activityAccountId: 'act-host-1',
      activityAccount: {
        displayName: '박서아 (인기 호스트)',
        handle: 'seoa_live',
      },
    },
  },
];

@Injectable()
export class SettlementService implements OnModuleInit {
  private readonly logger = new Logger(SettlementService.name);
  private readonly dataDir = path.join(process.cwd(), 'data');
  private settlementRequests: SettlementRequest[] = [];
  private refundRequests: RefundRequest[] = [];
  private purchases: PointPurchase[] = [];
  private ledger: WalletLedger[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadData();
  }

  private loadData() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      // 1. Settlement Requests
      const setPath = path.join(this.dataDir, 'settlements.json');
      if (fs.existsSync(setPath)) {
        this.settlementRequests = JSON.parse(fs.readFileSync(setPath, 'utf-8'));
      } else {
        this.settlementRequests = [...INITIAL_SETTLEMENT_REQUESTS];
        this.saveFile(setPath, this.settlementRequests);
      }

      // 2. Refund Requests
      const refPath = path.join(this.dataDir, 'refunds.json');
      if (fs.existsSync(refPath)) {
        this.refundRequests = JSON.parse(fs.readFileSync(refPath, 'utf-8'));
      } else {
        this.refundRequests = [...INITIAL_REFUND_REQUESTS];
        this.saveFile(refPath, this.refundRequests);
      }

      // 3. Purchases
      const purPath = path.join(this.dataDir, 'purchases.json');
      if (fs.existsSync(purPath)) {
        this.purchases = JSON.parse(fs.readFileSync(purPath, 'utf-8'));
      } else {
        this.purchases = [...INITIAL_PURCHASES];
        this.saveFile(purPath, this.purchases);
      }

      // 4. Ledger
      const ledPath = path.join(this.dataDir, 'ledger.json');
      if (fs.existsSync(ledPath)) {
        this.ledger = JSON.parse(fs.readFileSync(ledPath, 'utf-8'));
      } else {
        this.ledger = [...INITIAL_LEDGER];
        this.saveFile(ledPath, this.ledger);
      }

      this.logger.log('Settlement data loaded successfully.');
    } catch (err: any) {
      this.logger.warn(`Failed to load settlement data: ${err?.message}, using defaults.`);
      this.settlementRequests = [...INITIAL_SETTLEMENT_REQUESTS];
      this.refundRequests = [...INITIAL_REFUND_REQUESTS];
      this.purchases = [...INITIAL_PURCHASES];
      this.ledger = [...INITIAL_LEDGER];
    }
  }

  private saveFile(filePath: string, data: any) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err: any) {
      this.logger.error(`Error saving ${filePath}: ${err?.message}`);
    }
  }

  async getSummary() {
    let totalSpendableBalance = 0;
    let totalWallets = 0;

    try {
      const userAgg = await this.prisma.user.aggregate({
        _count: { id: true },
        _sum: { pointBalance: true },
      });
      totalWallets = userAgg._count.id;
      totalSpendableBalance = userAgg._sum.pointBalance ?? 0;
    } catch {
      totalWallets = 9;
      totalSpendableBalance = 658000;
    }

    const pendingRefunds = this.refundRequests.filter((r) => r.status === 'pending');
    const pendingSettlements = this.settlementRequests.filter((s) => s.status === 'PENDING');
    const approvedSettlements = this.settlementRequests.filter((s) => s.status === 'APPROVED');

    const totalPointsPurchased = this.purchases.reduce((acc, p) => acc + p.points, 0);
    const pendingSettlementsPoints = pendingSettlements.reduce((acc, s) => acc + s.pointsAmount, 0);
    const pendingSettlementsNetAmount = pendingSettlements.reduce((acc, s) => acc + s.netAmount, 0);
    const totalPlatformRevenueKrw = approvedSettlements.reduce((acc, s) => acc + s.platformFeeKrw, 0);

    return {
      totalPurchasesCount: this.purchases.length,
      totalPointsPurchased,
      pendingRefundsCount: pendingRefunds.length,
      pendingSettlementsCount: pendingSettlements.length,
      pendingSettlementsPoints,
      pendingSettlementsNetAmount,
      totalWallets: Math.max(totalWallets, 9),
      totalSpendableBalance: Math.max(totalSpendableBalance, 658000),
      totalRedeemableBalance: 480000,
      totalPendingEarnings: pendingSettlementsPoints,
      totalPlatformRevenueKrw: Math.max(totalPlatformRevenueKrw, 2800000),
      recentPurchases: this.purchases.slice(0, 5),
    };
  }

  async getSettlementRequests(params: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 15);
    let list = [...this.settlementRequests];

    if (params.status && params.status !== 'all') {
      list = list.filter((item) => item.status.toUpperCase() === params.status?.toUpperCase());
    }
    if (params.search?.trim()) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.id.toLowerCase().includes(q) ||
          (item.activityAccount?.displayName?.toLowerCase() || '').includes(q) ||
          (item.activityAccount?.handle?.toLowerCase() || '').includes(q) ||
          (item.accountHolder?.toLowerCase() || '').includes(q) ||
          (item.bankName?.toLowerCase() || '').includes(q) ||
          (item.accountNumber?.toLowerCase() || '').includes(q)
      );
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { ok: true, page, limit, total, totalPages, items };
  }

  async approveSettlement(id: string, adminMemo?: string) {
    const item = this.settlementRequests.find((s) => s.id === id);
    if (!item) throw new Error(`출금 요청 ID ${id}를 찾을 수 없습니다.`);

    item.status = 'APPROVED';
    item.adminMemo = adminMemo || '관리자 송금 및 정산 승인 완료';
    item.processedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    this.saveFile(path.join(this.dataDir, 'settlements.json'), this.settlementRequests);
    return item;
  }

  async rejectSettlement(id: string, reason: string) {
    const item = this.settlementRequests.find((s) => s.id === id);
    if (!item) throw new Error(`출금 요청 ID ${id}를 찾을 수 없습니다.`);

    item.status = 'REJECTED';
    item.rejectReason = reason;
    item.adminMemo = `반려 사유: ${reason}`;
    item.processedAt = new Date().toISOString();
    item.updatedAt = new Date().toISOString();

    this.saveFile(path.join(this.dataDir, 'settlements.json'), this.settlementRequests);
    return item;
  }

  async getRefundRequests() {
    return [...this.refundRequests].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async approveRefund(id: string) {
    const item = this.refundRequests.find((r) => r.id === id);
    if (!item) throw new Error(`환불 요청 ID ${id}를 찾을 수 없습니다.`);

    item.status = 'approved';
    item.decidedAt = new Date().toISOString();

    this.saveFile(path.join(this.dataDir, 'refunds.json'), this.refundRequests);
    return item;
  }

  async denyRefund(id: string) {
    const item = this.refundRequests.find((r) => r.id === id);
    if (!item) throw new Error(`환불 요청 ID ${id}를 찾을 수 없습니다.`);

    item.status = 'denied';
    item.decidedAt = new Date().toISOString();

    this.saveFile(path.join(this.dataDir, 'refunds.json'), this.refundRequests);
    return item;
  }

  async getPurchases(params: { page?: number; limit?: number; platform?: string }) {
    const page = Number(params.page ?? 1);
    const limit = Number(params.limit ?? 15);
    let list = [...this.purchases];

    if (params.platform && params.platform !== 'all') {
      list = list.filter((p) => p.platform.toLowerCase() === params.platform?.toLowerCase());
    }

    const total = list.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const start = (page - 1) * limit;
    const items = list.slice(start, start + limit);

    return { ok: true, page, limit, total, totalPages, items };
  }

  async getLedger(take = 25) {
    const limit = Number(take ?? 25);
    const items = this.ledger.slice(0, limit);
    return { ok: true, items };
  }
}
