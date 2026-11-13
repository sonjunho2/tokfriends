/**
 * MOCCO Suda (실시간 1줄 동네 토크 & 듀얼 대화함) Service
 */
import client, { getStoredUser } from '../api/client';

export interface SudaPostItem {
  id: string;
  author: {
    id: string;
    nickname: string;
    avatarUrl: string;
    trustScore: number;
  };
  title?: string;
  content: string;
  entryFee?: number;
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
    id: 'suda-sua',
    author: {
      id: 'user-suda-1',
      nickname: '수아',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300',
      trustScore: 99.2,
    },
    title: '양재천 산책 커피 타임 ☕',
    content: '선선해서 양재천 산책하기 딱 좋은 날씨네요! 같이 가벼운 커피 한잔 하실 이웃 계실까요? ☕🌿',
    entryFee: 0,
    neighborhood: '역삼1동',
    distanceKm: 0.6,
    likesCount: 14,
    repliesCount: 6,
    createdAt: '5분 전',
  },
  {
    id: 'suda-dohyun',
    author: {
      id: 'user-suda-2',
      nickname: '도현',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
      trustScore: 97.5,
    },
    title: '야식 메뉴 골라주세요 🍗',
    content: '오늘 야식 메뉴 고민인데 치킨 vs 매운 떡볶이 골라주세요! 추천해주시면 감사해요 🍗🔥',
    entryFee: 100,
    neighborhood: '역삼2동',
    distanceKm: 1.1,
    likesCount: 22,
    repliesCount: 15,
    createdAt: '12분 전',
  },
  {
    id: 'suda-yujin',
    author: {
      id: 'user-suda-3',
      nickname: '유진',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300',
      trustScore: 98.8,
    },
    title: '매봉산 강아지 산책로 🐶',
    content: '강아지랑 매봉산 둘레길 가려고 하는데 오늘 산책로 상태 괜찮은가요? 댕댕이 친구 환영! 🐶',
    entryFee: 200,
    neighborhood: '도곡동',
    distanceKm: 1.8,
    likesCount: 9,
    repliesCount: 4,
    createdAt: '25분 전',
  },
  {
    id: 'suda-jiwoo',
    author: {
      id: 'user-suda-4',
      nickname: '지우',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
      trustScore: 96.0,
    },
    title: '금요일 저녁 신사 가로수길 와인바 🍷',
    content: '퇴근길에 예쁜 노을 사진 찍었어요 🌇 다들 오늘 하루도 고생 많으셨습니다 화이팅!',
    entryFee: 1000,
    neighborhood: '논현1동',
    distanceKm: 2.2,
    likesCount: 31,
    repliesCount: 8,
    createdAt: '42분 전',
  },
  {
    id: 'suda-jisoo',
    author: {
      id: 'user-suda-5',
      nickname: '지수',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
      trustScore: 98.0,
    },
    title: '주말 한강 라이딩 하실 분 🚴‍♀️',
    content: '반포 한강공원에서 여의도까지 가볍게 라이딩해요! 초보자도 환영합니다 ✨',
    entryFee: 0,
    neighborhood: '반포본동',
    distanceKm: 3.1,
    likesCount: 18,
    repliesCount: 5,
    createdAt: '1시간 전',
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
const deletedSudaIds = new Set<string>();
const deletedChatIds = new Set<string>();

export async function fetchSudaPosts(neighborhood?: string): Promise<SudaPostItem[]> {
  try {
    const res = await client.get('/suda/posts', {
      params: { neighborhood },
      timeout: 4000,
    });
    const raw = res?.data;
    const items = Array.isArray(raw?.data)
      ? raw.data
      : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw)
      ? raw
      : Array.isArray(res?.items)
      ? res.items
      : [];

    if (items.length > 0) {
      const mapped = items
        .filter((p: any) => !deletedSudaIds.has(p.id))
        .map((p: any) => ({
          id: p.id,
          title: p.title || p.content?.slice(0, 30),
          content: p.content,
          entryFee: Number(p.entryFee || 0),
          neighborhood: p.neighborhood || '역삼1동',
          distanceKm: typeof p.distanceKm === 'number' ? p.distanceKm : 0.8,
          likesCount: Number(p.likesCount || p.likeCount || 0),
          repliesCount: Number(p.repliesCount || p.commentCount || 0),
          isLiked: Boolean(p.isLiked),
          createdAt: p.createdAt
            ? typeof p.createdAt === 'string' && p.createdAt.includes('분')
              ? p.createdAt
              : '최근'
            : '방금 전',
          author: {
            id: p.author?.id || 'author',
            nickname: p.author?.nickname || p.author?.displayName || '이웃',
            avatarUrl:
              p.author?.avatarUrl ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            trustScore: Number(p.author?.trustScore || 99.0),
          },
        }));
      inMemorySudaPosts = mapped;
      return mapped;
    }
  } catch (err) {
    // Offline or server unreachable fallback
  }
  return inMemorySudaPosts.filter((p) => !deletedSudaIds.has(p.id));
}

export async function createSudaPost(
  content: string,
  title?: string,
  entryFee: number = 0,
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
    title,
    content: content.trim(),
    entryFee,
    neighborhood,
    distanceKm: 0.1,
    likesCount: 0,
    repliesCount: 0,
    createdAt: '방금 전',
  };

  try {
    const res = await client.post('/suda/posts', {
      title: title ? title.trim() : undefined,
      content: content.trim(),
      entryFee,
      neighborhood,
    });
    const postData = res?.data?.data || res?.data;
    if (postData?.id) {
      inMemorySudaPosts = [postData, ...inMemorySudaPosts];
      return postData;
    }
  } catch (err) {
    // Local fallback
  }

  inMemorySudaPosts = [newPost, ...inMemorySudaPosts];
  return newPost;
}

export async function deleteSudaPost(postId: string): Promise<boolean> {
  deletedSudaIds.add(postId);
  try {
    await client.delete(`/suda/posts/${postId}`);
  } catch (err) {}
  inMemorySudaPosts = inMemorySudaPosts.filter((p) => p.id !== postId);
  return true;
}

export function addOrUpdateChatRoom(newRoom: ChatRoomItem) {
  if (deletedChatIds.has(newRoom.id)) {
    deletedChatIds.delete(newRoom.id);
  }
  const existingIndex = inMemoryChatRooms.findIndex(
    (r) => r.id === newRoom.id || r.peer?.id === newRoom.peer?.id || r.peer?.nickname === newRoom.peer?.nickname
  );
  if (existingIndex >= 0) {
    inMemoryChatRooms[existingIndex] = { ...inMemoryChatRooms[existingIndex], ...newRoom };
  } else {
    inMemoryChatRooms = [newRoom, ...inMemoryChatRooms];
  }
}

export function removeChatRoom(roomId: string) {
  deletedChatIds.add(roomId);
  inMemoryChatRooms = inMemoryChatRooms.filter((r) => r.id !== roomId);
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
  try {
    let currentUserId: string | undefined;
    let currentUserNickname: string | undefined;
    try {
      const u = await getStoredUser();
      if (u) {
        currentUserId = u.id || u.sub;
        currentUserNickname = u.nickname || u.name;
      }
    } catch {}

    const res = await client.get('/chats', {
      params: {
        userId: currentUserId,
        nickname: currentUserNickname,
      },
    });
    const items = res?.data?.items || res?.data?.data || res?.data;
    if (Array.isArray(items) && items.length > 0) {
      const serverRooms: ChatRoomItem[] = items.map((r: any) => {
        // 상대방 닉네임이 본인이 되지 않도록 철저한 2중 방어
        const isCounterpartMe =
          (currentUserNickname && (r.counterpart?.displayName === currentUserNickname || r.counterpart?.id === currentUserNickname)) ||
          (currentUserId && r.counterpart?.id === currentUserId) ||
          r.counterpart?.displayName === '나';

        let peerNickname = isCounterpartMe
          ? (r.host?.displayName && r.host.displayName !== currentUserNickname && r.host.displayName !== '나'
              ? r.host.displayName
              : (r.title && r.title !== currentUserNickname && r.title !== '나' ? r.title : '대화 상대'))
          : (r.counterpart?.displayName || r.title || '대화 상대');

        if (peerNickname === '나') {
          peerNickname = '대화 상대';
        }
        if (peerNickname === 'Super Admin' || peerNickname === 'admin') {
          peerNickname = '테스터02';
        }
        if (peerNickname === 'guest') {
          peerNickname = r.title && r.title !== 'guest' ? r.title : '대화 상대';
        }

        let peerAvatar = isCounterpartMe
          ? (r.host?.avatarUrl || r.counterpart?.avatarUrl)
          : (r.counterpart?.avatarUrl || r.host?.avatarUrl);

        return {
          id: r.id,
          type: r.category === 'MARKET' ? 'MARKET' : 'SUDA',
          peer: {
            id: isCounterpartMe ? (r.host?.id || 'peer') : (r.counterpart?.id || 'peer'),
            nickname: peerNickname,
            avatarUrl:
              peerAvatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
            isOnline: Boolean(r.counterpart?.online ?? true),
          },
          lastMessage: r.lastMessage || '대화가 시작되었습니다.',
          lastMessageTime: r.lastMessageAt
            ? new Date(r.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '방금',
          unreadCount: Number(r.unreadCount || 0),
        };
      });

      // Combine with in-memory market demo items if needed
      const marketRooms = inMemoryChatRooms.filter((r) => r.type === 'MARKET');
      const combined = [...serverRooms, ...marketRooms];
      const unique = Array.from(new Map(combined.map((m) => [m.id, m])).values()).filter((r) => !deletedChatIds.has(r.id));
      if (type) {
        return unique.filter((r) => r.type === type);
      }
      return unique;
    }
  } catch (err) {
    // Fallback to in-memory list
  }

  const fallback = inMemoryChatRooms.filter((r) => !deletedChatIds.has(r.id));
  if (type) {
    return fallback.filter((r) => r.type === type);
  }
  return fallback;
}
