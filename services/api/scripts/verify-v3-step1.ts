import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { MerchantsService } from '../src/modules/merchants/merchants.service';
import { AdsRewardsService } from '../src/modules/admin/ads-rewards.service';
import { MarketService } from '../src/modules/market/market.service';

async function runVerification() {
  console.log('========================================================');
  console.log('🚀 다가온(DAGAON) V3.0 1단계 백엔드 & 모듈 자동 검증 시작');
  console.log('========================================================\n');

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();

  const merchantsService = app.get(MerchantsService);
  const adsRewardsService = app.get(AdsRewardsService);
  const marketService = app.get(MarketService);

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  }

  // ----------------------------------------------------
  // 1. 입점사 등록 & 프로필 조회 검증
  // ----------------------------------------------------
  console.log('\n--- 1. 입점사(Merchant) 시스템 검증 ---');
  const testUserId = `test-user-${Date.now()}`;
  const regResult = await merchantsService.registerMerchant(testUserId, {
    businessName: '테스트 프레시 마켓',
    businessNumber: `999-${Math.floor(10 + Math.random() * 89)}-${Math.floor(10000 + Math.random() * 89999)}`,
    representative: '홍길동',
    onlineOrderNumber: '2026-서울강남-9999',
    bankName: '토스뱅크',
    accountNumber: '1000-1111-2222',
    accountHolder: '홍길동(테스트)',
  });
  assert(regResult.ok === true && regResult.merchant?.businessName === '테스트 프레시 마켓', '입점사 신청 및 사업자 등록 성공');
  assert(regResult.merchant?.status === 'PENDING_REVIEW', '신규 입점사 상태 PENDING_REVIEW 설정');

  const myMerchant = await merchantsService.getMyMerchant(testUserId);
  assert(myMerchant.ok === true && myMerchant.merchant?.id === regResult.merchant.id, '내 입점사 프로필 조회 성공');

  // ----------------------------------------------------
  // 2. B2C 상시 일반 상품(NormalProduct) 등록 & 수정 & 마켓 조회
  // ----------------------------------------------------
  console.log('\n--- 2. B2C 일반 상품(NormalProduct) 검증 ---');
  const prodResult = await merchantsService.createNormalProduct(regResult.merchant.id, {
    name: '[테스트입점] 산지직송 프리미엄 사과 3kg',
    description: '당도 14브릭스 이상 보장 꿀사과',
    priceKrw: 32000,
    salePriceKrw: 26900,
    stock: 50,
    images: ['https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600'],
    category: 'FOOD',
    shippingFee: 3000,
  });
  assert(prodResult.ok === true && prodResult.product?.name.includes('산지직송'), '입점사 일반 상품 등록 성공');

  const updateResult = await merchantsService.updateNormalProduct(
    regResult.merchant.id,
    prodResult.product.id,
    { stock: 45, salePriceKrw: 25000 }
  );
  assert(updateResult.ok === true && updateResult.product.stock === 45, '일반 상품 정보 및 재고 수정 성공');

  const marketNormalList = await merchantsService.listNormalProducts({ category: 'FOOD', sort: 'recent' });
  assert(marketNormalList.ok === true && marketNormalList.items.length > 0, '마켓 탭 상시 일반 상품 목록 조회 (카테고리 필터) 성공');

  // ----------------------------------------------------
  // 3. 플랫폼 광고(Ads) 구좌별 배너 조회 검증
  // ----------------------------------------------------
  console.log('\n--- 3. 플랫폼 광고(Ads) 구좌별 배너 조회 검증 ---');
  const homeBanners = await adsRewardsService.getPlacements('HOME_BANNER');
  assert(homeBanners.length > 0, 'HOME_BANNER 활성화 배너 조회 성공');

  const marketBanners = await adsRewardsService.getPlacements('MARKET_BANNER');
  assert(marketBanners.length > 0, 'MARKET_BANNER 활성화 배너 조회 성공');

  const liveBanners = await adsRewardsService.getPlacements('LIVE_BANNER');
  assert(liveBanners.length > 0, 'LIVE_BANNER 활성화 배너 조회 성공');

  // ----------------------------------------------------
  // 4. 보상형 광고 리워드 지급 & WalletLedger 기록 & 일일 5회 제한 검증
  // ----------------------------------------------------
  console.log('\n--- 4. 보상형 광고 10 ON 리워드 & 일일 5회 제한 검증 ---');
  const rewardUser = `usr_reward_test_${Date.now()}`;
  for (let i = 1; i <= 5; i++) {
    const claimRes = await adsRewardsService.claimAdReward(rewardUser, '리워드테스터');
    assert(claimRes.ok === true && claimRes.rewardPoints === 10, `광고 시청 ${i}회차: 10 ON 지급 성공`);
  }
  const claimExceed = await adsRewardsService.claimAdReward(rewardUser, '리워드테스터');
  assert(claimExceed.ok === false && claimExceed.error === 'DAILY_LIMIT_EXCEEDED', '일일 5회 초과 시 리워드 지급 차단 확인');

  // ----------------------------------------------------
  // 5. 관리자 입점사 심사 승인 & 수수료율(8~12%) 확정 검증
  // ----------------------------------------------------
  console.log('\n--- 5. 관리자 입점사 심사 승인 & 수수료 확정 검증 ---');
  const reviewRes = await merchantsService.reviewMerchant(regResult.merchant.id, {
    status: 'APPROVED' as any,
    feeRate: 9.5,
    adminMemo: '사업자등록증 및 통신판매업 정밀 검증 적격 승인',
  });
  assert(reviewRes.ok === true && reviewRes.merchant.status === 'APPROVED' && reviewRes.merchant.feeRate === 9.5, '입점사 심사 승인 및 계약 수수료율(9.5%) 확정 성공');

  // ----------------------------------------------------
  // 6. 관리자 일반 상품 숨김/승인 통제 검증
  // ----------------------------------------------------
  console.log('\n--- 6. 관리자 일반 상품 상태 통제 검증 ---');
  const hideRes = await merchantsService.updateNormalProduct('admin', prodResult.product.id, {
    status: 'HIDDEN' as any,
  });
  assert(hideRes.ok === true && hideRes.product.status === 'HIDDEN', '관리자 일반 상품 강제 숨김 성공');

  console.log('\n========================================================');
  console.log(`🎉 모든 1단계 핵심 기능 검증 완료: ${passedTests}/${totalTests} 통과`);
  console.log('========================================================\n');

  await app.close();
}

runVerification().catch((err) => {
  console.error('검증 중 오류 발생:', err);
  process.exit(1);
});
