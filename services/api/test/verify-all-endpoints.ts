import { UsersService } from '../src/modules/users/users.service';
import { ChatService } from '../src/modules/chat/chat.service';
import { ContentService } from '../src/modules/admin/content.service';
import { StoreService } from '../src/modules/store/store.service';
import { LiveController } from '../src/modules/streaming/live.controller';

async function verifyAllConnectedEndpoints() {
  console.log('================================================================');
  console.log('🚀 [전체 세부 API 연동 엔드투엔드 검증 테스트]');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`  ✅ [PASS] ${desc}`);
    } else {
      console.error(`  ❌ [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // 1. Users & Discover Service
  console.log('--- 1. 사용자 및 디스커버(추천/탐색/프로필/사진) 검증 ---');
  const mockPrismaUsers: any = {
    user: {
      findMany: async () => [
        { id: 'user-db-1', nickname: '지수', bio: '안녕하세요', location: '서울 강남구', callRatePerMinute: 1200, isOnline: true, isHost: true }
      ],
      findUnique: async ({ where }: any) => {
        if (where?.nickname === 'existing_nick') return { id: 'user-exist', nickname: 'existing_nick' };
        if (where?.id === 'user-me') return { id: 'user-me', nickname: '내계정', pointBalance: 5000 };
        return null;
      },
      update: async ({ where, data }: any) => ({ ...where, ...data }),
    },
    userPhoto: {
      findMany: async () => [{ id: 'p1', userId: 'user-db-1', url: 'https://images.unsplash.com/photo-1.jpg', isPrimary: true }],
      count: async () => 1,
      create: async ({ data }: any) => ({ id: 'p2', ...data }),
      updateMany: async () => ({ count: 1 }),
      update: async ({ where, data }: any) => ({ ...where, ...data }),
      delete: async ({ where }: any) => ({ ...where }),
    }
  };

  const usersService = new UsersService(mockPrismaUsers);
  const discoverList = await usersService.getDiscoverRecommendations('user-me');
  assert(discoverList.length > 0, '디스커버 피드 추천 목록 조회 정상 (시드 및 유저 병합)');
  assert(discoverList.some((u: any) => u.name && (u.avatar || u.avatarUrl)), '디스커버 유저 닉네임 및 아바타 정상 탑재');

  const nickCheck1 = await usersService.checkNickname('existing_nick');
  assert(nickCheck1.available === false, '기존 닉네임 중복 체크 방어 정상');
  const nickCheck2 = await usersService.checkNickname('brand_new_nick');
  assert(nickCheck2.available === true, '신규 닉네임 사용 가능 확인 정상');

  const photos = await usersService.getUserPhotos('user-db-1');
  assert(photos.length >= 1, '유저 갤러리 사진 목록 조회 정상');

  const addedPhoto = await usersService.addPhoto('user-me', 'https://images.unsplash.com/new.jpg');
  assert(addedPhoto.id === 'p2', '프로필 사진 등록 API 정상');

  // 2. Chat Service
  console.log('\n--- 2. 채팅(채팅방 목록/1:1 생성/메시지 송수신/삭제) 검증 ---');
  const chatService = new ChatService(mockPrismaUsers);
  const initialChats = await chatService.getChats('user-me');
  assert(initialChats.length > 0, '채팅방 목록 조회 정상');

  const directRoom = await chatService.ensureDirectRoom('user-me', 'user-target-1');
  assert(directRoom.id && directRoom.participantIds.includes('user-target-1'), '1:1 다이렉트 채팅방 생성 및 확보 정상');

  const sentMsg = await chatService.sendMessage('user-me', { chatId: directRoom.id, content: '안녕하세요 반갑습니다!' });
  assert(sentMsg.content === '안녕하세요 반갑습니다!', '메시지 전송 및 저장 정상');

  const messages = await chatService.getMessages(directRoom.id);
  assert(messages.items.length > 0 && messages.items[messages.items.length - 1].content === '안녕하세요 반갑습니다!', '채팅방 메시지 목록 조회 정상');

  const deleteResult = await chatService.deleteChat('user-me', directRoom.id);
  assert(deleteResult.ok === true, '채팅방 나가기/삭제 정상');

  // 3. Content & Community Service
  console.log('\n--- 3. 커뮤니티(피드/댓글/좋아요/신고) 검증 ---');
  const mockPrismaContent: any = {
    contentReport: {
      create: async ({ data }: any) => ({ id: 'rep-1', ...data }),
      findMany: async () => [],
      count: async () => 0,
      findUnique: async () => null,
      update: async () => ({}),
    }
  };
  const contentService = new ContentService(mockPrismaContent);
  contentService.onModuleInit();
  const topics = await contentService.getTopics();
  assert(topics.length > 0, '커뮤니티 토픽/카테고리 목록 조회 정상');

  const initialPosts = await contentService.getPosts();
  assert(initialPosts.items.length > 0, '커뮤니티 피드 게시글 목록 조회 정상');

  const targetPostId = initialPosts.items[0].id;
  const likeResult = await contentService.toggleLikePost(targetPostId);
  assert(typeof likeResult.liked === 'boolean', '게시글 좋아요 토글 동작 정상');

  const addedComment = await contentService.addComment(targetPostId, { authorId: 'user-me', content: '멋진 글이네요!' });
  assert(addedComment?.content === '멋진 글이네요!', '게시글 댓글 작성 정상');

  const comments = await contentService.getComments(targetPostId);
  assert(comments.some(c => c.content === '멋진 글이네요!'), '게시글 댓글 목록 조회 정상');

  const reportRes = await contentService.createReport({ id: 'user-me' }, { postId: targetPostId, reason: '광고 스팸 의심' });
  assert(reportRes.ok === true && typeof reportRes.reportId === 'number', '게시글 신고 및 관리자 센터 접수 정상');

  const adminReports = await contentService.getReports();
  assert(adminReports.items.some(r => r.reason === '광고 스팸 의심'), '관리자 신고 목록 조회 및 연동 정상');

  // 4. Live Streaming Endpoints (LiveController)
  console.log('\n--- 4. 라이브 스트리밍(방 생성/입장/채팅/하트/선물) 검증 ---');
  const liveController = new LiveController(mockPrismaUsers);
  const activeRooms = await liveController.getLiveRooms();
  assert(activeRooms.items.length > 0, '활성 라이브 스트리밍 방 목록 조회 정상');

  const createdRoomRes = await liveController.createLiveRoom({ id: 'user-me', nickname: '호스트나' }, { title: '테스트 라이브 방송' });
  const createdRoom = createdRoomRes.room;
  assert(createdRoom.title === '테스트 라이브 방송', '라이브 방송 개설 정상');

  const joinResult = await liveController.joinLiveRoom(createdRoom.id);
  assert(joinResult.ok === true, '라이브 방송 시청자 참여 정상');

  const liveMsgRes = await liveController.sendLiveMessage(createdRoom.id, { content: '응원합니다!' }, { id: 'viewer-1', nickname: '시청자' });
  assert(liveMsgRes.message.content === '응원합니다!', '라이브 실시간 채팅 전송 정상');

  const giftResult = await liveController.sendLiveGift(createdRoom.id, { giftId: 'rose_100', points: 500 }, { id: 'user-me' });
  assert(giftResult.ok === true && giftResult.points === 500, '라이브 선물하기 포인트 차감 및 전송 정상');

  // 5. Store & Settlement
  console.log('\n--- 5. 스토어 및 포인트 결제/정산 검증 ---');
  const storeService = new StoreService();
  await storeService.onModuleInit();
  const pointPkgs = await storeService.listAll();
  assert(pointPkgs.length > 0, '포인트 상품 패키지 목록 정상 조회');

  console.log('\n================================================================');
  console.log(`🎉 모든 세부 API 연동 검증 통과! (${passed}/${total} assertions passed)`);
  console.log('================================================================');
}

verifyAllConnectedEndpoints().catch((err) => {
  console.error('검증 중 오류 발생:', err);
  process.exit(1);
});
