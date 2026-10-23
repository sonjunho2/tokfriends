const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('c:/Users/ION/Downloads/work/tokfriends/services/api/node_modules/@prisma/client');
const argon2 = require('c:/Users/ION/Downloads/work/tokfriends/services/api/node_modules/argon2');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 [DAGAON V3.0] Starting Full Launch Production Seeding...');

  const defaultPasswordHash = await argon2.hash('Dagaon2026!@#');

  // Helper to upsert user safely without nickname collision
  async function safeUpsertUser({ email, nickname, displayName, role, pointBalance, avatarUrl, callRatePerMinute, bio }) {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const nickTaken = await prisma.user.findFirst({ where: { nickname } });
      const finalNickname = nickTaken ? `${nickname}_${Date.now().toString().slice(-4)}` : nickname;
      user = await prisma.user.create({
        data: {
          email,
          nickname: finalNickname,
          passwordHash: defaultPasswordHash,
          displayName,
          role,
          status: 'active',
          pointBalance: pointBalance || 0,
          avatarUrl,
          callRatePerMinute,
          bio,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          displayName,
          role,
          status: 'active',
          pointBalance: pointBalance || user.pointBalance,
          avatarUrl: avatarUrl || user.avatarUrl,
          callRatePerMinute: callRatePerMinute || user.callRatePerMinute,
          bio: bio || user.bio,
        },
      });
    }
    return user;
  }

  // 1. 최고 관리자 계정: admin@dagaon.app
  const adminUser = await safeUpsertUser({
    email: 'admin@dagaon.app',
    nickname: 'dagaon_admin',
    displayName: '다가온 총괄 관리자',
    role: 'admin',
    pointBalance: 999999,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
  });

  await prisma.adminProfile.upsert({
    where: { userId: adminUser.id },
    update: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: ['*'],
    },
    create: {
      userId: adminUser.id,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      permissions: ['*'],
    },
  });
  console.log('✅ 1. 최고 관리자 계정 준비 완료: admin@dagaon.app (비밀번호: Dagaon2026!@#)');

  // 2. 공식 입점사 계정: 제주푸드(주) (seller@jeju-food.com)
  const merchantUser = await safeUpsertUser({
    email: 'seller@jeju-food.com',
    nickname: 'jejufood_official',
    displayName: '제주푸드(주)',
    role: 'MERCHANT',
    pointBalance: 100000,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
  });

  let merchant = await prisma.merchant.findUnique({ where: { userId: merchantUser.id } });
  if (!merchant) {
    const existingM = await prisma.merchant.findUnique({ where: { businessNumber: '616-81-99881' } });
    if (existingM) {
      merchant = await prisma.merchant.update({
        where: { id: existingM.id },
        data: {
          userId: merchantUser.id,
          businessName: '제주푸드(주)',
          representative: '김제주',
          status: 'APPROVED',
          feeRate: 10.0,
        },
      });
    } else {
      merchant = await prisma.merchant.create({
        data: {
          userId: merchantUser.id,
          businessName: '제주푸드(주)',
          businessNumber: '616-81-99881',
          representative: '김제주',
          onlineOrderNumber: '2026-제주아라-0112호',
          businessCertUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
          onlineOrderUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600',
          status: 'APPROVED',
          feeRate: 10.0,
          bankName: '제주은행',
          accountNumber: '110-234-567890',
          accountHolder: '제주푸드(주)',
        },
      });
    }
  }
  console.log('✅ 2. 공식 입점사 계정 준비 완료: 제주푸드(주) (id: ' + merchant.id + ', 대표: 김제주)');

  // 3. 일반 유저 및 크리에이터 계정
  const buyerUser = await safeUpsertUser({
    email: 'user1@dagaon.app',
    nickname: 'buyer_king',
    displayName: '구매왕다가온',
    role: 'user',
    pointBalance: 50000,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
  });

  const creatorUser = await safeUpsertUser({
    email: 'creator@dagaon.app',
    nickname: 'hyewon_live',
    displayName: '제주소녀_혜원',
    role: 'CREATOR',
    callRatePerMinute: 1500,
    pointBalance: 30000,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: '제주도 청정 일상과 맛있는 특산물을 라이브로 소개합니다! 1:1 통화 환영 🍊',
  });
  console.log('✅ 3. 일반 유저(구매왕: 50,000 ON) 및 크리에이터(혜원: 분당 1,500 ON) 준비 완료');

  // 4. B2C 일반 상품 2종 (제주푸드)
  await prisma.normalProduct.upsert({
    where: { id: 'np-jeju-pork-01' },
    update: {
      merchantId: merchant.id,
      name: '[제주 직송] 프리미엄 1등급 제주 흑돼지 오겹살 500g',
      description: '제주 한라산 청정 농장에서 직송하는 1등급 프리미엄 제주 흑돼지 삼겹/오겹살입니다. 육즙이 풍부하고 쫄깃한 식감을 보장합니다.',
      priceKrw: 32000,
      salePriceKrw: 24900,
      stock: 150,
      images: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
      ],
      category: 'FOOD',
      status: 'ACTIVE',
      shippingFee: 0,
    },
    create: {
      id: 'np-jeju-pork-01',
      merchantId: merchant.id,
      name: '[제주 직송] 프리미엄 1등급 제주 흑돼지 오겹살 500g',
      description: '제주 한라산 청정 농장에서 직송하는 1등급 프리미엄 제주 흑돼지 삼겹/오겹살입니다. 육즙이 풍부하고 쫄깃한 식감을 보장합니다.',
      priceKrw: 32000,
      salePriceKrw: 24900,
      stock: 150,
      images: [
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
        'https://images.unsplash.com/photo-1558030006-450675393462?w=800',
      ],
      category: 'FOOD',
      status: 'ACTIVE',
      shippingFee: 0,
    },
  });

  await prisma.normalProduct.upsert({
    where: { id: 'np-jeju-hallabong-02' },
    update: {
      merchantId: merchant.id,
      name: '[제주 특산] 당도보장 제주 고당도 한라봉 선물세트 3kg',
      description: '비타민C가 풍부하고 새콤달콤한 제주 특산 한라봉입니다. 산지 직송 당도 13브릭스 이상 엄선 출하 상품.',
      priceKrw: 45000,
      salePriceKrw: 36000,
      stock: 80,
      images: [
        'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800',
      ],
      category: 'FOOD',
      status: 'ACTIVE',
      shippingFee: 3000,
    },
    create: {
      id: 'np-jeju-hallabong-02',
      merchantId: merchant.id,
      name: '[제주 특산] 당도보장 제주 고당도 한라봉 선물세트 3kg',
      description: '비타민C가 풍부하고 새콤달콤한 제주 특산 한라봉입니다. 산지 직송 당도 13브릭스 이상 엄선 출하 상품.',
      priceKrw: 45000,
      salePriceKrw: 36000,
      stock: 80,
      images: [
        'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=800',
      ],
      category: 'FOOD',
      status: 'ACTIVE',
      shippingFee: 3000,
    },
  });
  console.log('✅ 4. B2C 일반 상품 2종 등록 완료 (흑돼지 오겹살, 한라봉 선물세트)');

  // 5. C2C 중고 물품 및 B2C 공동구매 딜
  await prisma.marketProduct.upsert({
    where: { id: 'c2c-tent-01' },
    update: {
      sellerId: buyerUser.id,
      title: '[캠핑용품] 코베아 4인용 돔텐트 (실사용 2회 풀세트)',
      price: 85000,
      category: 'DIGITAL',
      status: 'ACTIVE',
      type: 'C2C_USED',
    },
    create: {
      id: 'c2c-tent-01',
      sellerId: buyerUser.id,
      title: '[캠핑용품] 코베아 4인용 돔텐트 (실사용 2회 풀세트)',
      description: '지난달 구매 후 2회 사용했습니다. 상태 S급이고 그라운드시트 및 팩 전부 포함입니다.',
      price: 85000,
      images: ['https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800'],
      locationName: '역삼1동',
      category: 'DIGITAL',
      status: 'ACTIVE',
      type: 'C2C_USED',
    },
  });

  await prisma.marketProduct.upsert({
    where: { id: 'b2c-airpods-01' },
    update: {
      sellerId: adminUser.id,
      title: '[특가공구] 에어팟 프로 2세대 USB-C 미개봉 정품',
      price: 249000,
      originalPrice: 359000,
      targetQuantity: 100,
      currentQuantity: 84,
      category: 'DIGITAL',
      status: 'ACTIVE',
      type: 'B2C_GROUP',
    },
    create: {
      id: 'b2c-airpods-01',
      sellerId: adminUser.id,
      title: '[특가공구] 에어팟 프로 2세대 USB-C 미개봉 정품',
      description: '애플 정품 국내 AS 가능 미개봉 새제품 한정수량 공동구매 딜입니다. 목표 수량 84% 달성 중!',
      price: 249000,
      originalPrice: 359000,
      targetQuantity: 100,
      currentQuantity: 84,
      images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=800'],
      locationName: '전국 무료배송',
      category: 'DIGITAL',
      status: 'ACTIVE',
      type: 'B2C_GROUP',
    },
  });
  console.log('✅ 5. C2C 중고 물품 및 B2C 공동구매 딜 등록 완료');

  // 6. 활성 광고 배너 2종 (advertisements.json 동기화)
  const adsPath = path.join(__dirname, '../data/advertisements.json');
  let currentAds = [];
  if (fs.existsSync(adsPath)) {
    try {
      currentAds = JSON.parse(fs.readFileSync(adsPath, 'utf8'));
    } catch {}
  }

  const newAds = [
    {
      id: 'ad-home-banner-01',
      title: '[홈 특가] 다가온 그랜드 론칭 기념 첫 구매 5,000 ON 쿠폰 증정!',
      description: '신규 회원 가입 즉시 지급되는 5,000 ON 쿠폰으로 마켓 쇼핑을 시작해보세요.',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
      targetUrl: 'https://dagaon.app/event/launch',
      placement: 'HOME_BANNER',
      priority: 10,
      rewardPoints: 0,
      clickCount: 1540,
      impressionCount: 21000,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'ad-market-banner-01',
      title: '[마켓 파트너] 제주푸드 공식 입점 특가전 - 흑돼지 & 한라봉 최대 40% 세일',
      description: '제주 산지 직송 프리미엄 흑돼지와 고당도 한라봉을 오픈 기념 특가로 만나보세요.',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200',
      targetUrl: 'https://dagaon.app/share/market/np-jeju-pork-01',
      placement: 'MARKET_BANNER',
      priority: 10,
      rewardPoints: 0,
      clickCount: 2310,
      impressionCount: 31200,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const na of newAds) {
    const idx = currentAds.findIndex(a => a.id === na.id);
    if (idx !== -1) currentAds[idx] = na;
    else currentAds.unshift(na);
  }

  fs.writeFileSync(adsPath, JSON.stringify(currentAds, null, 2), 'utf8');
  console.log('✅ 6. 활성 광고 배너 (HOME_BANNER, MARKET_BANNER) advertisements.json 동기화 완료');

  // 7. 시스템 기본 통화 요금 세팅
  await prisma.systemSetting.upsert({
    where: { key: 'DEFAULT_CALL_RATE_PER_MINUTE' },
    update: { value: '1500' },
    create: {
      key: 'DEFAULT_CALL_RATE_PER_MINUTE',
      value: '1500',
      description: '1:1 영상 통화 기본 분당 요금(1,500 ON)',
    },
  });
  console.log('✅ 7. 시스템 기본 통화 요금 세팅 완료 (1,500 ON/분)');

  console.log('\n🎉 [DAGAON V3.0] All seed data populated successfully!');
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
