import client from '../api/client';

export interface AdvertisementItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  targetUrl?: string;
  placement: 'HOME_BANNER' | 'MARKET_BANNER' | 'SHOP_BANNER' | 'LIVE_BANNER' | string;
  priority: number;
  rewardPoints: number;
  clickCount: number;
  impressionCount: number;
  isActive: boolean;
}

const FALLBACK_ADS: Record<string, AdvertisementItem[]> = {
  MARKET_BANNER: [
    {
      id: 'ad-mkt-1',
      title: '[마켓 단독] 제주 직영 1등급 흑돼지 & 한라봉 최대 40% 특가',
      description: '인증 입점사 당일 산지 직송! 신선 보증 에스크로 안전결제',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://dagaon.app/market',
      placement: 'MARKET_BANNER',
      priority: 10,
      rewardPoints: 0,
      clickCount: 120,
      impressionCount: 1540,
      isActive: true,
    },
    {
      id: 'ad-mkt-2',
      title: '다가온 공식 검증 브랜드 스토어 오픈 페스티벌 🎁',
      description: '입점사 전 상품 무료배송 혜택 + 구매 확정 시 5% 온(ON) 적립',
      imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://dagaon.app/market',
      placement: 'MARKET_BANNER',
      priority: 8,
      rewardPoints: 0,
      clickCount: 95,
      impressionCount: 1120,
      isActive: true,
    },
  ],
  HOME_BANNER: [
    {
      id: 'ad-home-1',
      title: '신규 회원 웰컴 보너스 100 온 지급 이벤트',
      description: '가입 즉시 100 온이 지갑으로 충전됩니다. 첫 라이브 방송을 응원해보세요!',
      imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://dagaon.app/event/welcome',
      placement: 'HOME_BANNER',
      priority: 10,
      rewardPoints: 0,
      clickCount: 1420,
      impressionCount: 18500,
      isActive: true,
    },
    {
      id: 'ad-home-2',
      title: '무료 충전소 OPEN — 광고 보고 매일 50 온 받기',
      description: '동영상 광고를 1회 시청할 때마다 10 온이 즉시 적립됩니다. (일일 최대 5회)',
      imageUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://dagaon.app/reward-station',
      placement: 'HOME_BANNER',
      priority: 9,
      rewardPoints: 10,
      clickCount: 3890,
      impressionCount: 29400,
      isActive: true,
    },
  ],
  LIVE_BANNER: [
    {
      id: 'ad-live-1',
      title: '다가온 공식 크리에이터 2기 대모집 💎',
      description: '최대 80% 업계 최고 환급율! 나만의 팬덤을 만들고 주인공이 되어보세요.',
      imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&auto=format&fit=crop&q=80',
      targetUrl: 'https://dagaon.app/creator/recruit',
      placement: 'LIVE_BANNER',
      priority: 10,
      rewardPoints: 0,
      clickCount: 920,
      impressionCount: 14200,
      isActive: true,
    },
  ],
};

export async function fetchAdsByPlacement(
  placement: 'HOME_BANNER' | 'MARKET_BANNER' | 'SHOP_BANNER' | 'LIVE_BANNER' | string
): Promise<AdvertisementItem[]> {
  try {
    const res = await client.get(`/ads/placements/${placement}`, { timeout: 3500 });
    const items = res?.data?.items || res?.data?.data || res?.data;
    if (Array.isArray(items) && items.length > 0) {
      return items;
    }
  } catch (err) {
    // Network fallback
  }

  const norm = placement.toUpperCase();
  if (norm === 'MARKET_BANNER' || norm === 'SHOP_BANNER') {
    return FALLBACK_ADS.MARKET_BANNER || [];
  }
  return FALLBACK_ADS[norm] || FALLBACK_ADS.HOME_BANNER || [];
}

export function recordAdImpression(adId: string) {
  if (!adId) return;
  client.post(`/ads/${adId}/impression`, {}, { timeout: 3000 }).catch(() => {});
}

export function recordAdClick(adId: string) {
  if (!adId) return;
  client.post(`/ads/${adId}/click`, {}, { timeout: 3000 }).catch(() => {});
}

export async function claimAdReward(userId?: string, userNickname?: string) {
  try {
    const res = await client.post('/ads/reward/claim', {
      userId,
      userNickname,
    }, { timeout: 4000 });
    return res?.data || res;
  } catch (err: any) {
    const data = err?.response?.data;
    if (data) return data;
    return {
      ok: false,
      message: err?.message || '광고 리워드 적립 요청에 실패했습니다.',
    };
  }
}
