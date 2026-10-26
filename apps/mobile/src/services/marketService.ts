/**
 * DAGAON Market & Escrow Service
 * C2C 중고거래 및 B2C 공동구매 에스크로(안전거래) 서비스
 * 
 * 경제 정책: 1 ON = 1 KRW (원화 1:1 직관 연동)
 */
import client from '../api/client';

export interface MarketProduct {
  id: string;
  type: 'C2C_USED' | 'B2C_GROUP';
  title: string;
  description: string;
  category: string;
  price: number;              // ON 포인트 (1 ON = 1원)
  originalPrice?: number;     // B2C 공구 시 정가
  targetQuantity?: number;    // 공구 목표 인원
  currentQuantity?: number;   // 현재 참여 인원
  images: string[];
  status: 'ACTIVE' | 'RESERVED' | 'COMPLETED';
  locationName: string;
  distanceKm: number;
  seller: {
    id: string;
    nickname: string;
    avatarUrl: string;
    trustScore: number;       // 매너/신뢰 지수 (예: 98.5)
  };
  likesCount: number;
  chatsCount: number;
  isLiked?: boolean;
  createdAt: string;
  isHqDirect?: boolean;
  ownerType?: string;
  allowAffiliate?: boolean;
  affiliateCommissionRate?: number;
}

export const MARKET_CATEGORIES = [
  { id: 'ALL', label: '전체' },
  { id: 'DIGITAL', label: '디지털/가전' },
  { id: 'FURNITURE', label: '가구/인테리어' },
  { id: 'FOOD_GROUP', label: '식품/공구' },
  { id: 'FASHION', label: '패션/잡화' },
  { id: 'LIFESTYLE', label: '생활/주방' },
  { id: 'BEAUTY', label: '뷰티/미용' },
  { id: 'SPORTS', label: '스포츠/레저' },
];

export const INITIAL_MARKET_PRODUCTS: MarketProduct[] = [
  // C2C 중고거래
  {
    id: 'prod-c2c-1',
    type: 'C2C_USED',
    title: '아이폰 15 프로 256GB 내추럴 티타늄 (배터리 99%)',
    description: '풀박스 상태입니다. 기스나 찍힘 전혀 없고 케이스/강화유리 항상 착용했습니다. 에스크로 안전결제 환영하며 직거래는 역삼역 3번출구 희망합니다.',
    category: 'DIGITAL',
    price: 980000,
    images: [
      'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '역삼1동',
    distanceKm: 0.8,
    seller: {
      id: 'seller-1',
      nickname: '테크러버',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      trustScore: 99.2,
    },
    likesCount: 18,
    chatsCount: 5,
    createdAt: '10분 전',
  },
  {
    id: 'prod-c2c-2',
    type: 'C2C_USED',
    title: '미사용 신품 스노우피크 캠핑 체어 2개 세트',
    description: '캠핑 가려고 구매했다가 보관만 한 미개봉 새제품입니다. 2개 일괄로만 판매합니다.',
    category: 'SPORTS',
    price: 135000,
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '삼성동',
    distanceKm: 1.4,
    seller: {
      id: 'seller-2',
      nickname: '캠핑가자',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      trustScore: 96.8,
    },
    likesCount: 12,
    chatsCount: 3,
    createdAt: '35분 전',
  },
  {
    id: 'prod-c2c-3',
    type: 'C2C_USED',
    title: '에어팟 맥스 실버 풀박스 (스마트 케이스 포함)',
    description: '실내에서 음악 작업용으로만 아껴 썼습니다. 이어쿠션 오염 전혀 없고 상태 최상입니다. 직거래 환영합니다.',
    category: 'DIGITAL',
    price: 490000,
    images: [
      'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '논현동',
    distanceKm: 2.1,
    seller: {
      id: 'seller-3',
      nickname: '사운드마스터',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      trustScore: 98.0,
    },
    likesCount: 24,
    chatsCount: 8,
    createdAt: '1시간 전',
  },

  // B2C 공동구매 특가
  {
    id: 'prod-b2c-1',
    type: 'B2C_GROUP',
    title: '[입점사특가] 제주 산지직송 프리미엄 흑돼지 오겹살 1kg',
    description: '입점 브랜드 직배송! 냉장 신선포장 당일 발송. 목표 인원 도달 시 즉시 발송됩니다. 온 포인트 에스크로로 안전 결제!',
    category: 'FOOD_GROUP',
    price: 24900,
    originalPrice: 42000,
    targetQuantity: 30,
    currentQuantity: 26,
    images: [
      'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '전국 무료배송',
    distanceKm: 0,
    seller: {
      id: 'seller-b2c-1',
      nickname: '제주푸드 본사 직영',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
      trustScore: 100,
    },
    likesCount: 142,
    chatsCount: 19,
    createdAt: '마감 3시간 전',
  },
  {
    id: 'prod-b2c-2',
    type: 'B2C_GROUP',
    title: '[핫딜공구] 고당도 논산 설향 딸기 특상 1kg (500g x 2팩)',
    description: '새벽 수확 당일 출고! 산지 직송으로 마트 대비 40% 저렴한 공동구매 혜택을 누리세요.',
    category: 'FOOD_GROUP',
    price: 15900,
    originalPrice: 28000,
    targetQuantity: 50,
    currentQuantity: 42,
    images: [
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '전국 무료배송',
    distanceKm: 0,
    seller: {
      id: 'seller-b2c-2',
      nickname: '논산농협 로컬푸드',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      trustScore: 99.8,
    },
    likesCount: 98,
    chatsCount: 11,
    createdAt: '마감 5시간 전',
  },
  {
    id: 'prod-b2c-3',
    type: 'B2C_GROUP',
    title: '[D LIVE 연계공구] 호텔식 60수 고밀도 순면 차렵이불 세트',
    description: '오늘 밤 9시 D LIVE 방송 중 구매 시 사은품 베개커버 2장 추가 증정! 부드러운 알러지케어 차렵이불.',
    category: 'FURNITURE',
    price: 49000,
    originalPrice: 98000,
    targetQuantity: 20,
    currentQuantity: 18,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
    ],
    status: 'ACTIVE',
    locationName: '전국 무료배송',
    distanceKm: 0,
    seller: {
      id: 'seller-b2c-3',
      nickname: '메종리빙 공식스토어',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
      trustScore: 99.5,
    },
    likesCount: 65,
    chatsCount: 7,
    createdAt: '마감 8시간 전',
  },
];

let inMemoryProducts = [...INITIAL_MARKET_PRODUCTS];

export async function fetchMarketProducts(params?: {
  type?: 'C2C_USED' | 'B2C_GROUP';
  category?: string;
  query?: string;
}): Promise<MarketProduct[]> {
  try {
    const res = await client.get('/market/products', {
      params: {
        type: params?.type,
        category: params?.category,
        search: params?.query,
      },
      timeout: 3000,
    });
    if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
      return res.data.items;
    }
  } catch (err) {
    // Fallback to offline in-memory data
  }

  let filtered = [...inMemoryProducts];

  if (params?.type) {
    filtered = filtered.filter((p) => p.type === params.type);
  }

  if (params?.category && params.category !== 'ALL') {
    if (params.category === 'HQ_DIRECT') {
      filtered = filtered.filter((p) => p.isHqDirect === true);
    } else {
      filtered = filtered.filter((p) => p.category === params.category);
    }
  }

  if (params?.query && params.query.trim()) {
    const q = params.query.trim().toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.locationName.toLowerCase().includes(q)
    );
  }

  return filtered;
}

export async function fetchMarketProductById(id: string): Promise<MarketProduct | null> {
  try {
    const res = await client.get(`/market/products/${id}`, { timeout: 3000 });
    if (res?.data?.id) {
      return res.data;
    }
  } catch (err) {
    // Fallback
  }
  const item = inMemoryProducts.find((p) => p.id === id);
  return item || null;
}

export async function createMarketProduct(
  data: Omit<MarketProduct, 'id' | 'createdAt' | 'likesCount' | 'chatsCount'>
): Promise<MarketProduct> {
  const newProduct: MarketProduct = {
    ...data,
    id: `prod-local-${Date.now()}`,
    likesCount: 0,
    chatsCount: 0,
    createdAt: '방금 전',
  };

  try {
    const res = await client.post('/market/products', {
      type: data.type,
      title: data.title,
      description: data.description,
      category: data.category,
      price: data.price,
      originalPrice: data.originalPrice,
      targetQuantity: data.targetQuantity,
      images: data.images,
      locationName: data.locationName,
      latitude: 37.4979,
      longitude: 127.0276,
    });
    if (res?.data?.id) {
      inMemoryProducts = [res.data, ...inMemoryProducts];
      return res.data;
    }
  } catch (err) {
    // Fallback
  }

  inMemoryProducts = [newProduct, ...inMemoryProducts];
  return newProduct;
}

// ==========================================
// B2C 입점사 상시 일반 상품 (NormalProduct)
// ==========================================

export interface NormalProduct {
  id: string;
  merchantId: string;
  merchantName?: string;
  name: string;
  description: string;
  priceKrw: number;
  salePriceKrw?: number;
  stock: number;
  images: string[];
  category: string;
  status: 'ACTIVE' | 'OUT_OF_STOCK' | 'HIDDEN' | 'DELETED';
  shippingFee: number;
  createdAt: string;
  isHqDirect?: boolean;
  ownerType?: string;
  allowAffiliate?: boolean;
  affiliateCommissionRate?: number;
  merchant?: {
    id: string;
    businessName: string;
    representative: string;
    businessNumber: string;
    onlineOrderNumber?: string;
    feeRate?: number;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
  };
}

export const INITIAL_NORMAL_PRODUCTS: NormalProduct[] = [
  {
    id: 'np-hq-001',
    merchantId: 'mer-hq',
    merchantName: '모꼬(MOCCO) 본사 공식 직영관',
    name: '[본사직영] 프리미엄 나주 특등급 햇배 5kg 세트 (산지직송)',
    description: '당도 13브릭스 이상 엄선 나주 특등급 햇배 산지직송 명품 선물세트.',
    priceKrw: 39000,
    salePriceKrw: 32900,
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1514756331096-242fdeb7004a?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'FOOD_GROUP',
    status: 'ACTIVE',
    shippingFee: 0,
    createdAt: '2026-10-22 10:00',
    isHqDirect: true,
    ownerType: 'HEADQUARTERS',
    allowAffiliate: true,
    affiliateCommissionRate: 10.0,
    merchant: {
      id: 'mer-hq',
      businessName: '모꼬(MOCCO) 본사 공식 직영관',
      representative: '모꼬 본사',
      businessNumber: '101-86-00000',
    },
  },
  {
    id: 'np-001',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 산지직송 프리미엄 1등급 흑돼지 오겹살 1kg',
    description: '제주 청정 농가에서 당일 도축 후 신선 포장 발송하는 1등급 명품 흑돼지 오겹살입니다.',
    priceKrw: 38000,
    salePriceKrw: 32900,
    stock: 150,
    images: [
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'FOOD',
    status: 'ACTIVE',
    shippingFee: 3000,
    createdAt: '2026-10-21 15:00',
    merchant: {
      id: 'mer-001',
      businessName: '제주푸드 본사 직영',
      representative: '고성훈',
      businessNumber: '616-81-99201',
      onlineOrderNumber: '2025-제주오라-0112',
    },
  },
  {
    id: 'np-002',
    merchantId: 'mer-001',
    merchantName: '제주푸드 본사 직영',
    name: '[입점사상시] 제주 유기농 감귤 착즙 원액주스 1000ml (3병 세트)',
    description: '물 한 방울 섞지 않은 무가당 100% 제주 감귤 순수 착즙 프리미엄 주스입니다.',
    priceKrw: 29000,
    salePriceKrw: 24900,
    stock: 80,
    images: [
      'https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'FOOD',
    status: 'ACTIVE',
    shippingFee: 0,
    createdAt: '2026-10-20 12:30',
    merchant: {
      id: 'mer-001',
      businessName: '제주푸드 본사 직영',
      representative: '고성훈',
      businessNumber: '616-81-99201',
      onlineOrderNumber: '2025-제주오라-0112',
    },
  },
  {
    id: 'np-003',
    merchantId: 'mer-002',
    merchantName: '메디컬 헬스케어랩',
    name: '[공식인증] 고순도 프리미엄 알티지 오메가3 120캡슐 (4개월분)',
    description: 'IFOS 최고등급 원료 사용, 흡수율 높은 rTG형 오메가3로 혈행 및 눈 건강을 지켜드립니다.',
    priceKrw: 55000,
    salePriceKrw: 42000,
    stock: 200,
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'LIVING',
    status: 'ACTIVE',
    shippingFee: 2500,
    createdAt: '2026-10-19 16:20',
    merchant: {
      id: 'mer-002',
      businessName: '메디컬 헬스케어랩',
      representative: '김정민',
      businessNumber: '214-88-34190',
      onlineOrderNumber: '2026-서울강남-0482',
    },
  },
  {
    id: 'np-004',
    merchantId: 'mer-003',
    merchantName: '어반 라이프 스타일',
    name: '[입점사상시] 무소음 초음파 감성 아로마 무드등 가습기 500ml',
    description: '심플한 모던 인테리어 디자인과 7가지 은은한 LED 무드등 기능이 탑재된 초음파 가습기.',
    priceKrw: 42000,
    salePriceKrw: 35000,
    stock: 60,
    images: [
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
    ],
    category: 'LIVING',
    status: 'ACTIVE',
    shippingFee: 3000,
    createdAt: '2026-10-18 11:45',
    merchant: {
      id: 'mer-003',
      businessName: '어반 라이프 스타일',
      representative: '이지은',
      businessNumber: '105-86-77312',
      onlineOrderNumber: '2026-경기성남-1920',
    },
  },
];

let inMemoryNormalProducts = [...INITIAL_NORMAL_PRODUCTS];

export async function fetchNormalProducts(params?: {
  category?: string;
  search?: string;
  sort?: 'recent' | 'priceAsc' | 'priceDesc' | 'popular' | string;
}): Promise<NormalProduct[]> {
  try {
    const res = await client.get('/market/normal-products', {
      params: {
        category: params?.category,
        search: params?.search,
        sort: params?.sort || 'recent',
      },
      timeout: 3500,
    });
    if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
      return res.data.items;
    }
  } catch (err) {
    // Network fallback
  }

  let list = [...inMemoryNormalProducts];
  if (params?.category && params.category !== 'ALL') {
    if (params.category === 'HQ_DIRECT') {
      list = list.filter((p) => p.isHqDirect === true);
    } else {
      list = list.filter((p) => p.category.toUpperCase() === params.category?.toUpperCase());
    }
  }
  if (params?.search && params.search.trim()) {
    const q = params.search.trim().toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.merchantName && p.merchantName.toLowerCase().includes(q))
    );
  }
  if (params?.sort === 'priceAsc') {
    list.sort((a, b) => (a.salePriceKrw ?? a.priceKrw) - (b.salePriceKrw ?? b.priceKrw));
  } else if (params?.sort === 'priceDesc') {
    list.sort((a, b) => (b.salePriceKrw ?? b.priceKrw) - (a.salePriceKrw ?? a.priceKrw));
  }

  return list;
}

export async function fetchNormalProductById(id: string): Promise<NormalProduct | null> {
  try {
    const res = await client.get(`/market/normal-products/${id}`, { timeout: 3500 });
    const product = res?.data?.product || res?.data;
    if (product?.id) {
      return product;
    }
  } catch (err) {
    // Network fallback
  }

  const found = inMemoryNormalProducts.find((p) => p.id === id);
  return found || null;
}

export async function fetchMyMerchantProducts(): Promise<{ merchant: any; products: NormalProduct[] }> {
  try {
    const res = await client.get('/merchants/my', { timeout: 3500 });
    if (res?.data) {
      return {
        merchant: res.data.merchant || null,
        products: res.data.products || [],
      };
    }
  } catch (err) {
    // Network fallback
  }

  return {
    merchant: {
      id: 'mer-001',
      businessName: '제주푸드 본사 직영',
      representative: '고성훈',
      status: 'APPROVED',
      feeRate: 9.5,
    },
    products: inMemoryNormalProducts.filter((p) => p.merchantId === 'mer-001'),
  };
}
