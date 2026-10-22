/**
 * DAGAON Suda (실시간 1줄 동네 토크 & 듀얼 대화함) Service
 */
import client from '../api/client';

export interface SudaPostItem {
  id: string;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string;
    trustScore: number;
  };
  content: string;
  neighborhood: string;
  distanceKm: number;
  likesCount: number;
  repliesCount: number;
  isLiked?: boolean;
  createdAt: string;
}

export interface ChatRoomItem {
  id: string;
  type: 'SUDA' | 'MARKET';
  peer: {
    id: string;
    nickname: string;
    avatarUrl: string;
    isOnline: boolean;
  };
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  // 거래 톡일 경우
  marketOrder?: {
    orderId: string;
    productTitle: string;
    productImage: string;
    price: number;
    escrowStatus: 'ESCROW_HOLD' | 'SHIPPED' | 'CONFIRMED' | 'DISPUTED';
  };
}

export const INITIAL_SUDA_POSTS: SudaPostItem[] = [
  {
    id: 'suda-1',
    author: {
      id: 'user-suda-1',
      nickname: '수아',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      trustScore: 99.2,
    },
    content: '선선해서 양재천 산책하기 딱 좋은 날씨네요! 같이 가벼운 커피 한잔 하실 이웃 계실까요? ☕🌿',
    neighborhood: '역삼1동',
    distanceKm: 0.6,
    likesCount: 14,
    repliesCount: 6,
    createdAt: '5분 전',
  },
  {
    id: 'suda-2',
    author: {
      id: 'user-suda-2',
      nickname: '도현',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
      trustScore: 97.5,
    },
    content: '오늘 야식 메뉴 고민인데 치킨 vs 매운 떡볶이 골라주세요! 추천해주시면 감사해요 🍗🔥',
    neighborhood: '역삼2동',
    distanceKm: 1.1,
    likesCount: 22,
    repliesCount: 15,
    createdAt: '12분 전',
  },
  {
    id: 'suda-3',
    author: {
      id: 'user-suda-3',
      nickname: '유진',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
      trustScore: 98.8,
    },
    content: '강아지랑 매봉산 둘레길 가려고 하는데 오늘 산책로 상태 괜찮은가요? 댕댕이 친구 환영! 🐶',
    neighborhood: '도곡동',
    distanceKm: 1.8,
    likesCount: 9,
    repliesCount: 4,
    createdAt: '25분 전',
  },
  {
    id: 'suda-4',
    author: {
      id: 'user-suda-4',
      nickname: '지우',
      avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
      trustScore: 96.0,
    },
    content: '퇴근길에 예쁜 노을 사진 찍었어요 🌇 다들 오늘 하루도 고생 많으셨습니다 화이팅!',
    neighborhood: '논현1동',
    distanceKm: 2.2,
    likesCount: 31,
    repliesCount: 8,
    createdAt: '42분 전',
  },
];

export const INITIAL_CHAT_ROOMS: ChatRoomItem[] = [
  // 수다 톡 (친목·인연)
  {
    id: 'room-suda-1',
    type: 'SUDA',
    peer: {
      id: 'user-suda-1',
      nickname: '수아',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isOnline: true,
    },
    lastMessage: '네! 저도 양재천 근처 카페 좋아해요 ㅎㅎ',
    lastMessageTime: '14:20',
    unreadCount: 1,
  },
  {
    id: 'room-suda-2',
    type: 'SUDA',
    peer: {
      id: 'user-suda-3',
      nickname: '유진',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200',
      isOnline: false,
    },
    lastMessage: '주말에 강아지 데리고 같이 산책해요!',
    lastMessageTime: '어제',
    unreadCount: 0,
  },

  // 거래 톡 (상거래 전용 에스크로 고정)
  {
    id: 'room-market-1',
    type: 'MARKET',
    peer: {
      id: 'seller-1',
      nickname: '테크러버',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      isOnline: true,
    },
    lastMessage: '안전결제 확인되었습니다. 오늘 저녁 7시 역삼역 3번출구에서 뵙겠습니다!',
    lastMessageTime: '15:05',
    unreadCount: 2,
    marketOrder: {
      orderId: 'ORD-202610-8812',
      productTitle: '아이폰 15 프로 256GB 내추럴 티타늄',
      productImage: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
      price: 980000,
      escrowStatus: 'ESCROW_HOLD',
    },
  },
  {
    id: 'room-market-2',
    type: 'MARKET',
    peer: {
      id: 'seller-b2c-1',
      nickname: '제주푸드 본사 직영',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
      isOnline: false,
    },
    lastMessage: '공동구매 목표 인원이 달성되어 산지 직송 출고되었습니다.',
    lastMessageTime: '어제',
    unreadCount: 0,
    marketOrder: {
      orderId: 'ORD-202610-4421',
      productTitle: '[입점사특가] 제주 산지직송 프리미엄 흑돼지 1kg',
      productImage: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600',
      price: 24900,
      escrowStatus: 'SHIPPED',
    },
  },
];

let inMemorySudaPosts = [...INITIAL_SUDA_POSTS];
let inMemoryChatRooms = [...INITIAL_CHAT_ROOMS];

export async function fetchSudaPosts(neighborhood?: string): Promise<SudaPostItem[]> {
  try {
    const res = await client.get('/suda/posts', {
      params: { neighborhood },
      timeout: 3000,
    });
    if (res?.data?.items && Array.isArray(res.data.items) && res.data.items.length > 0) {
      return res.data.items;
    }
  } catch (err) {
    // Offline or server unreachable fallback
  }
  return inMemorySudaPosts;
}

export async function createSudaPost(
  content: string,
  neighborhood: string = '역삼1동'
): Promise<SudaPostItem> {
  const newPost: SudaPostItem = {
    id: `suda-${Date.now()}`,
    author: {
      id: 'my-user-id',
      nickname: '나',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
      trustScore: 99.0,
    },
    content: content.trim(),
    neighborhood,
    distanceKm: 0.1,
    likesCount: 0,
    repliesCount: 0,
    createdAt: '방금 전',
  };

  try {
    const res = await client.post('/suda/posts', {
      content: content.trim(),
      neighborhood,
    });
    if (res?.data?.id) {
      inMemorySudaPosts = [res.data, ...inMemorySudaPosts];
      return res.data;
    }
  } catch (err) {
    // Local fallback
  }

  inMemorySudaPosts = [newPost, ...inMemorySudaPosts];
  return newPost;
}

export async function likeSudaPost(postId: string): Promise<number> {
  try {
    const res = await client.post(`/suda/posts/${postId}/like`);
    if (typeof res?.data?.likesCount === 'number') {
      return res.data.likesCount;
    }
  } catch (err) {
    // Local fallback
  }

  const post = inMemorySudaPosts.find((p) => p.id === postId);
  if (post) {
    post.likesCount += 1;
    post.isLiked = true;
    return post.likesCount;
  }
  return 1;
}

export async function fetchChatRooms(type?: 'SUDA' | 'MARKET'): Promise<ChatRoomItem[]> {
  if (type) {
    return inMemoryChatRooms.filter((r) => r.type === type);
  }
  return inMemoryChatRooms;
}
