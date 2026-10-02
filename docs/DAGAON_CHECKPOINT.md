# DAGAON Development Checkpoint

Updated: 2026-10-02
Official Brand Name: **다가온 (DAGAON)**
Brand Slogan: **새로운 사람이 다가오고, 새로운 이야기가 시작된다.**

## 2026-10-02 Checkpoint 19: 라이브 방송 뷰어 실시간 반응/플로팅 하트 및 3D 선물 고도화 (완료)

### 1. 플로팅 하트 애니메이션 오버레이 신설 (`apps/mobile/src/components/FloatingHeartsOverlay.js`)
- **틱톡/인스타그램 스타일 60fps 네이티브 플로팅 하트 연출**:
  - `Animated.timing` & `Animated.sequence` 기반의 자연스러운 곡선 흔들림(Sway trajectory), 크기 팽창, 투명도 페이드아웃 효과.
  - 다채로운 8종 생동감 있는 하트 컬러 팔레트 (`#FF3B6B`, `#EC4899`, `#F59E0B`, `#FEE500` 등).
  - 하트 버튼 터치 시 3연타 버스트 연출(`addHeartsBurst(3)`), WebSocket `like` 이벤트 수신 시 실시간 동기화 렌더링.

### 2. 라이브 룸 상단 프로필 및 인터랙션 강화 (`apps/mobile/src/screens/live/LiveRoomScreen.js`)
- **호스트 프로필 원터치 상세 보기**:
  - 방송 상단 좌측 호스트 필(`hostPill`) 터치 시 호스트 프로필 상세 화면(`ProfileDetailScreen`)으로 부드럽게 네비게이션.
- **3D 선물 이펙트와 플로팅 하트의 자연스러운 레이어 분리**:
  - 선물 비디오 CG 애니메이션(`GiftEffectOverlay`)과 실시간 시청자 하트 리액션(`FloatingHeartsOverlay`)이 겹쳐도 버벅임 없이 매끄럽게 동시 연출.

---

## 2026-10-02 Checkpoint 18: 크리에이터 포인트 정산 신청 및 내역 관리 센터(Settlement) 구축 (완료)

### 1. 전용 정산 화면 신설 (`apps/mobile/src/screens/my/SettlementScreen.js`)
- **실시간 수익금 현황 헤더 카드**:
  - 출금 가능 수익 포인트(`redeemableBalance`), 심사 대기 포인트(`pendingEarnings`) 실시간 표시.
  - 1P = 1원 기준 및 최소 출금 신청 포인트(10,000P) 안내.
- **상단 듀얼 탭 전환 (`[출금 신청하기]`, `[신청 내역 N]`)**:
  - **탭 1: 출금 신청 양식**:
    - 포인트 전액 입력 원터치 버튼.
    - 실시간 원천징수 세액(3.3%) 및 실제 입금 예정액 자동 계산기.
    - 국내 8대 주요 은행(국민, 신한, 우리, 하나, 카카오, 토스, 농협, 기업) 원터치 칩 선택 및 직접 입력.
    - 계좌번호, 본인 명의 예금주 성명 실명 확인 안내.
    - 2단계 최종 신청 확인 다이얼로그 (신청 포인트, 공제 세액, 실 입금액, 계좌 안내).
  - **탭 2: 출금 신청 내역**:
    - 심사중(`PENDING`), 승인완료(`APPROVED`), 반려됨(`REJECTED`) 상태별 세련된 배지.
    - 신청일자, 입금 계좌, 관리자 메모 및 반려 사유 실시간 안내.
- **당겨서 새로고침(Pull-to-refresh)**: 최신 잔액 및 심사 상태 즉시 갱신.

### 2. 마이페이지 및 스토어 연동 (`SettingsScreen.js` & `ShopScreen.js`)
- **`SettingsScreen.js`**: 도움말/활동 링크 목록에 `[크리에이터 수익금 출금]` 메뉴 추가.
- **`ShopScreen.js`**: 크리에이터 출금/환전 카드에서 [출금 신청] 터치 시 전용 `SettlementScreen`으로 즉시 네비게이션.
- **`RootNavigator.js`**: `HomeStackNav` 및 `MyPageStackNav`에 `SettlementScreen` 완벽 등록.

---

## 2026-10-02 Checkpoint 17: 커뮤니티 동네생활 게시글 상세(PostDetail) 및 실시간 댓글 시스템 고도화 (완료)

### 1. 모바일 클라이언트 단일 게시글 조회 API 신설 (`apps/mobile/src/api/client.js`)
- **`getPost(postId)` 메서드 구현**:
  - `GET /posts/:postId` 엔드포인트 연동.
  - 네트워크 단절 및 목데이터 모드 시 로컬 메모리 스토어(`DUMMY_POSTS`) 안전 fallback 제공.

### 2. 커뮤니티 게시글 상세 화면 신설 (`apps/mobile/src/screens/community/PostDetailScreen.js`)
- **다가온 브랜드 기반 카드 레이아웃**:
  - 작성자 프로필 헤더 (아바타, 닉네임, 지역, 작성 시간 경과 표시, 내 글 뱃지).
  - 토픽 태그 배지 (`#동네 소식`, `#취미 / 운동` 등).
  - 게시글 본문 텍스트 및 다중 미디어 이미지 갤러리 렌더링.
  - 상단 옵션 메뉴: 공유하기(`Share.share`), 게시글 신고, 작성자 차단, 내 글 삭제.
- **실시간 인터랙션 바**:
  - 낙관적 UI(Optimistic UI) 기반 좋아요 토글 (`apiClient.togglePostLike`).
  - 작성자와 즉시 1:1 대화 연결 (`ensureDirectRoom` -> `ChatRoom`).
  - 작성자 프로필 상세 네비게이션 (`ProfileDetailScreen`).
- **댓글(Comments) 피드 및 입력 시스템**:
  - 실시간 댓글 개수 및 상대 시간("방금 전", "10분 전") 표기.
  - 내 댓글 즉시 삭제 기능 (`apiClient.deletePostComment`).
  - 빈 댓글 상태 일러스트 안내 ("따뜻한 첫 댓글을 남겨 이웃과 이야기를 시작해보세요!").
  - 하단 인터랙티브 댓글 입력 바 (`TextInput`, 카카오 옐로우 전송 버튼, 전송 중 로딩 스피너).
  - 당겨서 새로고침(Pull-to-refresh) 지원.

### 3. 네비게이션 및 피드 연동 (`RootNavigator.js` & `CommunityFeedScreen.js`)
- **`RootNavigator.js` 등록**:
  - `CommunityStackNav`, `HomeStackNav`, `MyPageStackNav`에 `PostDetail` 스크린 완벽 등록.
- **`CommunityFeedScreen.js` 터치 인터랙션 연동**:
  - 피드 내 게시글 카드 본문 및 미디어 터치 시 `PostDetailScreen`으로 부드러운 전환 지원.

---

## 2026-10-02 Checkpoint 16: 내 프로필 방문자(Visitors) & 팔로워/팔로잉(Follows) 센터 구축 (완료)

### 1. 백엔드 소셜 프로필 상세 조인 엔리치먼트 (`profile-visits.service.ts` & `follows.service.ts`)
- **프로필 방문자 목록 API 엔리치먼트 (`profile-visits.service.ts`)**:
  - `listReceived` / `listSent` 조회 시 방문자 계정의 `legacyUser` (`profile: { nickname, headline, avatarUri }`, `region1`, `region2`, `id`) 정보를 다이렉트로 조인 및 플랫 매핑.
  - 모바일 클라이언트에서 추가적인 유저 조회 왕복 통신 없이도 방문자 닉네임, 지역, 아바타, 한줄소개를 즉각 렌더링.
- **팔로워 / 팔로잉 목록 API 엔리치먼트 (`follows.service.ts`)**:
  - `listFollowers` / `listFollowing` 조회 시 대상 계정의 `legacyUser` 프로필 및 지역 정보를 자동 엔리치먼트하여 반환.

### 2. 모바일 클라이언트 API 함수 신설 (`apps/mobile/src/api/client.js`)
- **`getProfileVisits({ type, limit, offset })`**:
  - 나를 방문한 유저 및 내가 방문한 유저 목록 조회 (네트워크 오프라인 시 목데이터 fallback 탑재).
- **`getFollowers(accountId, { limit, offset })` & `getFollowing(accountId, { limit, offset })`**:
  - 특정 계정의 팔로워/팔로잉 목록 페이징 조회 함수 신설.

### 3. 방문자 관리 화면 신설 (`apps/mobile/src/screens/my/VisitorsScreen.js`)
- **다가온 브랜드 아이덴티티 카드 UI**:
  - 카카오 옐로우 `#FEE500` 안내 배너 ("나에게 관심을 보인 소중한 인연들이에요").
  - 상대적 방문 시간 계산기 ("방금 전", "15분 전", "3시간 전", "어제" 등).
  - 방문자 아바타, 닉네임, 지역(`서울 강남구`), 한줄 소개 표시.
  - [1:1 대화] 버튼 터치 시 `ensureDirectRoom`을 통해 즉시 채팅방 개설 및 이동.
  - 방문자 카드 터치 시 `ProfileDetail` 상세 보기로 부드럽게 네비게이션.
  - 당겨서 새로고침(Pull-to-refresh) 및 방문자 없을 시 산뜻한 빈 화면 안내.

### 4. 팔로워 / 팔로잉 관리 화면 신설 (`apps/mobile/src/screens/my/FollowsScreen.js`)
- **상단 듀얼 탭 전환 (`[팔로워 N]`, `[팔로잉 N]`)**:
  - 실시간 카운터 배지와 탭 인디케이터 제공.
  - 맞팔 여부 감지 및 즉각적인 팔로우/언팔로우 액션 (`apiClient.followAccount`, `apiClient.unfollowAccount`).
  - 당겨서 새로고침(Pull-to-refresh) 및 회원 프로필 상세 연동.

### 5. 마이페이지(SettingsScreen) 소셜 관계 허브 연동 & 네비게이션 등록
- **프로필 하단 소셜 카운터 바 (방문자 / 팔로워 / 팔로잉 / 친구) 신설**:
  - 실시간 방문자 수, 팔로워 수, 팔로잉 수, 친구 수를 한눈에 볼 수 있는 카운터 바 배치 및 원터치 이동 지원.
- **도움말/활동 링크 목록에 추가**:
  - [프로필 방문자], [팔로워 / 팔로잉 관리] 메뉴 아이템 신설.
- **`RootNavigator.js` 등록**:
  - `HomeStackNav` 및 `MyPageStackNav`에 `Visitors`, `Follows`, `ChatRoom` 스크린 완벽 등록.

---

## 2026-10-02 Checkpoint 15: 회원가입 온보딩 프로필 등록(ProfileRegistration) 고도화 & 닉네임 중복검사 및 관심사 연동 (완료)

### 1. 백엔드 가입 온보딩 관심사(Interests) & 아바타 파이프라인 확장 (`dto.ts` & `auth.service.ts`)
- **`CompletePhoneProfileDto` 필드 확장 (`services/api/src/modules/auth/dto.ts`)**:
  - `interests?: string[]` 유효성 검증 필드(`@IsArray`, `@IsString`) 신설.
- **`completePhoneProfile` 온보딩 트랜잭션 연동 (`auth.service.ts`)**:
  - 가입 시 클라이언트가 선택한 관심사 배열을 받아 신규 회원 프로필 생성(`tx.user.create -> profile.create`) 시 `interests` 필드에 즉시 원자적 영구 저장.

### 2. 모바일 가입 온보딩 프로필 등록 화면 전면 개편 (`ProfileRegistrationScreen.js`)
- **닉네임 실시간 중복 확인 인터랙션**:
  - 닉네임 인풋 우측에 카카오 옐로우 `#FEE500` [중복확인] 액션 버튼 배치 및 상태 배지(확인 전, 사용 가능, 중복/금칙어) 연동.
  - 가입 버튼 터치 시 닉네임 중복 확인 미완료 상태인 경우 선제 자동 검증 수행.
- **온보딩 관심사(Interests) 칩 선택 섹션 신설**:
  - 음악, 영화, 카페, 맛집, 여행, 운동, 게임, 요리, 반려동물 등 16종 인기 추천 태그를 카카오 감성 토글 칩으로 제공.
  - 최대 10개 선택 제한 및 가입 시 서버로 직접 동봉 전송.
- **성별 & 출생연도 UI 고도화**:
  - 여성/남성 아이콘 라디오 카드 UI 제공 (활성화 시 카카오 옐로우 `#FEE500` + 볼드 차콜 `#191919`).
  - 출생연도 유효성 실시간 안내.
- **17개 시/도 지역 선택 모달 (Region Picker)**:
  - 지역 1(시/도) 터치 시 17개 특별·광역·도 선택 모달 팝업 제공 및 지역 2(시/군/구) 입력 결합.
- **글자 수 카운터 및 자기소개 UX**:
  - 한줄 소개 (최대 40자, `N/40`), 자기소개 (다줄 입력, 최대 300자, `N/300`).
- **사진 업로드 & 안전한 가입 트랜잭션**:
  - 갤러리 접근 권한 요청 및 사진 선택, 미리보기.
  - 가입 진행 시 `uploadAvatar` 선제 실행 및 가입 완료 시 `authenticateWithToken`을 통한 원활한 자동 로그인 수립.

---

## 2026-10-02 Checkpoint 14: 내 프로필 수정 화면(ProfileEdit) 고도화 & 닉네임 실시간 중복검사 및 프로필 연동 (완료)

### 1. 백엔드 닉네임 유효성 및 중복 검사 API 신설 (`users.controller.ts` & `users.service.ts`)
- **실시간 닉네임 검사 엔드포인트 (`GET /users/check-nickname`)**:
  - `nickname` 파라미터 수신 및 2~12자 길이, 특수문자 제한 정규식 검증.
  - `BannedWord` 금칙어 테이블과 연동하여 비속어/음란어 등 유해 단어 포함 여부 원천 차단.
  - 탈퇴 유저(`withdrawn`)를 제외한 활성 회원의 `displayName` 및 `profile.nickname`과 대소문자 무시(case-insensitive) 중복 여부 확인.
  - 현재 로그인한 본인 계정 ID는 중복 대상에서 제외(`excludeUserId`)하여 본인 기존 닉네임 유지 시 정상 통과.
- **친구 상태 조회 고도화 (`friendships.service.ts`)**:
  - `getStatus` 반환 객체에 `friendshipId` 필드를 포함하도록 확장하여, 프로필 상세 화면에서 친구 관계 식별 및 즉시 해제 가능하도록 지원.

### 2. 모바일 내 프로필 수정 화면 전면 개편 (`ProfileEditScreen.js`)
- **닉네임 중복 확인 인터랙션**:
  - 닉네임 인풋 우측에 직관적인 [중복확인] 액션 버튼 배치 및 실시간 상태 배지(현재 닉네임, 사용 가능, 중복/금칙어 포함, 변경 후 미검사) 연동.
  - 변경사항 저장 시 중복 검사를 거치지 않은 경우 자동으로 선제 검증 수행.
- **17개 시/도 지역 선택 모달 (Region Picker)**:
  - 지역 1(시/도) 터치 시 대한민국 17개 특별·광역·도 선택 모달 팝업 제공.
  - 지역 2(시/군/구) 입력란과 결합하여 신뢰도 높은 지역 정보 설정 지원.
- **글자 수 카운터 및 자기소개 UX**:
  - 한줄 소개 (최대 40자, 실시간 `N/40` 카운터).
  - 자기소개 (최대 300자, 다줄 입력 및 실시간 `N/300` 카운터).
- **16종 추천 관심사 (Interests) 칩 시스템**:
  - 음악, 영화, 카페, 맛집, 여행, 운동, 게임, 요리, 반려동물 등 16종 프리셋 태그 토글 칩 버튼.
  - 선택된 태그는 카카오 옐로우(`#FEE500`) 배경과 볼드 텍스트로 시각화, 최대 10개 제한 및 직접 입력 추가/개별 삭제 기능 지원.
- **실시간 프로필 미리보기 카드 (Live Preview)**:
  - 아바타, 닉네임, 지역, 한줄 소개, 자기소개, 관심사 해시태그 칩이 실시간으로 반영되는 프리뷰 카드 제공.
- **사진 관리 및 세션 동기화**:
  - 갤러리 접근 권한 요청 및 사진 크롭/업로드(`uploadAvatar`), 기본 사진 초기화 옵션.
  - 저장 시 `updateUser` API 호출 및 `refreshMe()` 전역 세션 즉시 동기화.

### 3. 프로필 상세 화면 및 네비게이션 연계 (`ProfileDetailScreen.js` & `RootNavigator.js`)
- **프로필 상세 화면 친구 관리 원터치 액션**:
  - 이미 친구 사이인 회원 열람 시 [친구] 버튼 터치 시 즉시 안내 다이얼로그를 통해 [친구 끊기] 옵션 제공 및 `removeFriend` 연동.
  - 내가 보낸 요청인 경우 [요청 취소하기], 상대방이 보낸 요청인 경우 [수락하기]를 프로필 화면에서 다이렉트 수행 가능.
- **스택 네비게이션 연계**:
  - `HomeStackNav`에 `ProfileEdit` 스크린을 정식 등록하여, 홈 화면 상단 내 프로필 미니 배너 → 프로필 상세 → 프로필 수정으로 이어지는 UX 흐름 완성.

---

## 2026-10-01 Checkpoint 13: 친구 관리 화면 고도화 & 친구 삭제(끊기) 파이프라인 연동 (완료)

### 1. 백엔드 친구 삭제(Unfriend) 트랜잭션 API 신설 (`friendships.controller.ts` & `friendships.service.ts`)
- **친구 관계 해제 파이프라인 (`POST /friendships/:id/remove`)**:
  - `status: 'accepted'` 상태인 기존 친구 관계를 사용자가 직접 해제할 수 있는 공식 엔드포인트 신설.
  - 요청자(`requesterId`) 또는 수신자(`addresseeId`) 본인 검증을 거쳐 `Friendship` 레코드를 안전하게 원자적 제거.

### 2. 모바일 친구 목록 친구 끊기 액션 및 확인 다이얼로그 (`FriendsScreen.js`)
- **친구 끊기 액션 버튼 및 안전 확인**:
  - [친구 목록] 탭의 각 친구 카드 우측 [대화하기] 버튼 옆에 [친구 끊기 (`person-remove-outline`)] 아이콘 액션 버튼 신설.
  - 터치 시 안내 다이얼로그("'{이름}'님과 친구 관계를 끊으시겠습니까? 언제든 다시 친구 요청을 보낼 수 있습니다.")를 띄워 실수로 인한 해제를 방지하고, 확인 시 `apiClient.removeFriend(id)`를 호출하여 목록을 실시간 갱신.
- **차단 회원 관리 (`BlockedUsersScreen.js`) 연계 점검**:
  - 차단 해제(`handleUnblock`) 및 프로필 아바타/지역 표시 상태를 점검하여 친구/차단 관리 흐름의 정합성을 완벽하게 동기화.

---

## 2026-10-01 Checkpoint 12: 마이페이지 설정 & 회원 탈퇴/고객센터/보안 및 운영정책 연동 고도화 (완료)

### 1. 백엔드 회원 탈퇴(계정 삭제) 트랜잭션 파이프라인 (`users.controller.ts` & `users.service.ts`)
- **앱스토어/구글플레이 및 개인정보보호법 준수 회원 탈퇴 (`DELETE /users/me`)**:
  - `deleteAccount` 트랜잭션을 통해 디바이스 푸시 토큰(`Device`) 삭제, 계정 상태 비활성화(`status: 'withdrawn'`), 세션 토큰 무효화(`tokenVersion` 증가), 식별 정보(`email`, `phoneHash`, `displayName`, `profile`) 익명화 및 `ActivityAccount` 비활성화를 일괄 원자적 처리.

### 2. 모바일 회원 탈퇴 다중 확인 다이얼로그 및 세션 만료 (`SettingsScreen.js`)
- **2단계 안전 탈퇴 워크플로우 (`handleDeleteAccount`)**:
  - 오작동 방지를 위한 2단계 확인 다이얼로그(탈퇴 시 데이터/포인트 소멸 안내 -> 최종 확인)를 제공하고, 확인 시 `apiClient.deleteAccount()` 실행 후 즉시 클라이언트 세션을 종료하고 로그인 화면으로 안전하게 복귀.
- **계정 관리 섹션 UI 분리**:
  - 기존 로그아웃 버튼 아래에 은은한 톤의 [회원 탈퇴] 버튼을 정돈된 구분선과 함께 배치하여 앱스토어 심사 기준을 100% 충족.

### 3. 고객센터 및 커뮤니티 운영정책 연동
- **고객센터 및 운영정책 모달 연동**:
  - 도움말 섹션에 [고객센터 및 운영정책] 항목을 추가하여 `community-guidelines` 법적 문서를 팝업 모달로 즉시 열람할 수 있도록 지원.

---

## 2026-10-01 Checkpoint 11: 포인트 충전 상점 (Shop) & 결제 내역/법적 고지 및 브랜드 연동 고도화 (완료)

### 1. 백엔드 포인트 충전 내역 조회 API 신설 (`store.controller.ts` & `store.service.ts`)
- **충전/결제 이력 조회 파이프라인 (`GET /store/purchases/history`)**:
  - `PointPurchase` 테이블로부터 현재 로그인된 사용자의 최근 인앱/토스/포트원 포인트 구매 기록(상품 ID, 주문 번호, 결제 플랫폼, 충전 포인트, 결제 일시 및 상태)을 역순 50건까지 안전하게 반환하는 엔드포인트 신설 (`JwtAuthGuard` 보호).

### 2. 모바일 포인트 충전 내역 모달 및 실시간 지갑 동기화 (`ShopScreen.js`)
- **상단 충전 내역 조회 모달 (`purchaseHistoryModalVisible`)**:
  - 충전소 화면 상단 GNB에 [충전 내역] 영수증 액션 버튼 신설.
  - 터치 시 최근 충전 내역(결제 플랫폼별 App Store / Google Play / 토스페이 / 포트원 배지, 충전 일시, 충전 포인트 및 '결제 완료' 상태)을 깔끔한 모달 형태로 조회 가능.
- **결제 완료 후 자동 동기화**:
  - 인앱 결제(IAP) 승인 완료 및 샌드박스 결제 완료 시 사용자 프로필(`refreshMe()`)뿐만 아니라 충전 내역(`loadPurchaseHistory()`)까지 동시에 실시간 갱신.

### 3. 전자상거래법/앱마켓 규정 준수 및 브랜드 동기화
- **VAT(부가세 10%) 포함 및 환불 규정 안내 블록 (`legalNoticeBox`)**:
  - "모든 결제 금액은 VAT(부가세 10%) 포함 금액입니다. 충전된 포인트는 다가온 앱 내 선물 및 소통 기능 이용에 사용되며, 미사용 포인트의 청약철회 및 환불은 전자상거래법 및 앱마켓 규정에 따라 처리됩니다." 고지 박스 신설.
- **공식 브랜드명 및 슬로건 통일**:
  - 친구 초대 리워드 공유 메시지의 기존 명칭(`[톡프렌즈]`)을 공식 브랜드명인 **`[다가온]`** 및 공식 슬로건("새로운 사람이 다가오고, 새로운 이야기가 시작됩니다!")으로 전면 동기화.

---

## 2026-10-01 Checkpoint 10: 라이브 방송 실시간 선물 후원 & 시청자 인터랙션 고도화 (완료)

### 1. 라이브 선물 메시지 및 응답 페이로드 완성도 보강 (`live.service.ts`)
- **선물 썸네일(`thumbnailUrl`) 누락 보완**:
  - `sendGiftToRoom` 내부 `liveMessage.content` JSON 문자열 및 최종 API 응답 객체에 선물의 대표 이미지(`gift.thumbnailUrl`)를 추가하여, 클라이언트와 웹소켓 구독자가 즉시 이미지와 함께 3D/알파 이펙트를 재생할 수 있도록 데이터 규격 정합성 확보.

### 2. 모바일 실시간 선물 후원 및 잔액 동기화 (`LiveRoomScreen.js`)
- **실시간 포인트 잔액 자동 동기화 (`fetchMyPoints`)**:
  - 방 입장 시 및 [선물하기 🎁] 버튼 터치 시 `apiClient.getMe()`를 통해 서버의 최신 포인트 잔액을 조회하여 선물 선택 바텀시트(`GiftPickerSheet`)에 즉시 반영.
  - 선물 후원 성공 시 서버에서 반환된 `newBalance`를 즉시 반영하고, 호스트의 누적 선물 포인트(`totalGiftsPoints`)를 실시간 업데이트.
- **실시간 웹소켓 후원 이벤트 연동**:
  - 시청자가 선물을 후원할 때 웹소켓 `LIVE_SOCKET_EVENTS.MESSAGE`의 `msg.type === 'gift'` 이벤트를 감지하여, 방의 `totalGiftsPoints`를 실시간 가산하고 중복 방지 Set(`processedGiftMessageIdsRef`)을 거쳐 전체화면 3D 이펙트 오버레이(`giftOverlayRef`)에 FIFO 대기열로 인큐.

### 3. 실시간 선물 말풍선 및 상단 누적 후원 배지 UX 고도화
- **후원 전용 메시지 렌더링 (`renderMessageItem`)**:
  - 기존의 원문 JSON 문자열 노출을 개선하여, `🎁 [선물명] 후원! (0,000P)` 형태의 골드 톤 후원 배지와 후원자 닉네임 하이라이트 표시.
- **상단 헤더 누적 후원 카운터 (`giftTotalBadge`)**:
  - 방송 상단 헤더 우측에 실시간 누적 선물 포인트(예: `🎁 50,000P`) 배지를 신설하여, 호스트와 시청자 모두 현재 방송의 후원 달성 현황을 한눈에 체감할 수 있도록 시각화.

---

## 2026-10-01 Checkpoint 9: 라이브 스트리밍 아고라(Agora) 관리자 설정 연동 & 토큰 발급 및 실시간 방송 스트림 고도화 (완료)

### 1. 관리자 시스템 환경설정과 Agora RTC 실시간 연동
- **암호화 자격증명 복호화 및 토큰 발급 파이프라인 (`admin-settings.service.ts` & `live.service.ts`)**:
  - 관리자 웹 시스템 설정(`AdminSettings`)에 안전하게 저장된 `agora_app_id` 및 `agora_app_certificate`를 `this.adminSettings.getDecryptedSetting()`으로 실시간 복호화.
  - 호스트 방송 개설 및 시청자 입장 시 공식 Agora RTC 규격(006 버전, HMAC-SHA256 암호화 토큰)의 토큰을 채널명(`roomId`)과 숫자 UID(`userIdToAgoraUid`) 기반으로 발급.
  - 자격증명 미설정 시 안전한 Fallback 개발 토큰 모드를 지원하여 중단 없는 서비스 가용성 보장.

### 2. 라이브 방송 개설 시 Agora Token 통합 반환
- **방송 시작 대기 시간 단축 (`POST /live/rooms`)**:
  - `createRoom` API 응답에 생성된 룸 정보와 함께 호스트의 Agora RTC 토큰(`agoraToken`)을 즉시 포함하여 반환함으로써, 방송 개설 후 추가 요청 없이 0초 만에 실시간 스트리밍 송출로 즉시 진입하도록 최적화.

### 3. 모바일 라이브 룸 Agora RTC 상태 표시 고도화 (`LiveRoomScreen.js`)
- **실시간 스트림 상태 인디케이터**:
  - 상단 헤더에 `agoraTokenData` 수신 여부에 따라 **`🟢 RTC HD`** 실시간 초저지연 연결 배지 노출.
  - 호스트의 오디오 파형 미터 및 카메라/마이크 토글 제어 툴바와 실시간 동기화.

---

## 2026-10-01 Checkpoint 8: 프로필 상세 화면 고도화 & 방문자 기록 및 프로필 선물하기 연동 (완료)

### 1. 프로필 방문자 실시간 기록 파이프라인
- **백엔드 방문 타겟 식별 고도화 (`profile-visits.service.ts`)**:
  - `POST /profile-visits/:targetAccountId` 호출 시, `activityAccount.id`뿐만 아니라 `owner.legacyUserId`로도 계정을 안전하게 역조회(`OR` 검색)하여 클라이언트가 어떤 식별자를 전달하더라도 정확하게 `ProfileVisit`에 기록.
  - 활동 알림 센터(Checkpoint 6)와 유기적으로 결합되어, 피방문자에게 "👀 새로운 이웃이 프로필을 둘러보았습니다" 알림이 실시간으로 노출됨.
- **모바일 프로필 상세 화면 (`ProfileDetailScreen.js`)**:
  - 상대방 프로필 진입 시 `recordProfileVisit` 자동 디스패치 (본인 프로필 열람 시에는 제외).
  - `targetAccountId`가 누락된 경우 `getUserById`를 통해 서버에서 즉시 계정 ID를 조회·보완하여 안정적 방문 기록 보장.

### 2. 프로필 화면 내 바로 선물하기(Gift) 연동
- **`GiftPickerSheet` 및 `GiftEffectOverlay` 탑재**:
  - 프로필 상세 화면에서 마음에 드는 상대방에게 채팅방을 거치지 않고도 즉시 선물을 전송할 수 있는 [선물하기 🎁] 액션 버튼 신설.
  - 선물 선택 시 `ensureDirectRoom`으로 1:1 대화방을 안전하게 확보한 뒤 `sendChatGift`를 호출하여 선물 트랜잭션 실행.
  - 실시간 보유 포인트 차감, 화면 내 3D CG 이펙트 애니메이션 연출 및 전송 완료 피드백 다이얼로그 제공.

### 3. 소셜 인터랙션 액션 버튼 3단 레이아웃 개편
- **소통 및 관계 형성 UX 극대화**:
  - **1행 (후원 & 호감)**: [🎁 선물하기] (포인트 핑크 하이라이트) & [❤️ 관심 보내기]
  - **2행 (관계 형성)**: [👤 팔로우] & [🤝 친구 요청 / 친구 수락]
  - **3행 (메인 액션)**: [💬 1:1 대화 시작하기] (전체 너비 프라이머리 버튼)

### 4. 프로필 사진 전체화면 확대 모달
- 상단 원형 아바타 터치 시 어두운 배경의 전체화면 포토 뷰어 모달을 띄워 상대방의 고화질 프로필 사진을 선명하게 감상할 수 있도록 편의성 제공.

---

## 2026-10-01 Checkpoint 7: 1:1 채팅방 내 선물 보내기 모달 & 실시간 선물 수신 및 3D 이펙트 연동 (완료)

### 1. 1:1 채팅 선물 전송 & 실시간 수신 파이프라인
- **`ChatRoomScreen.js` 선물 전송 및 수신 고도화**:
  - `handleSendGift`: 백엔드 `POST /chats/gift` 트랜잭션 호출 후 반환된 최신 잔액(`response.spendableBalance`)으로 내 보유 포인트를 즉시 갱신하고 화면 내 3D 이펙트 큐(`giftOverlayRef.current.enqueueGift`) 발동.
  - `handleRealtimeMessage`: 실시간 웹소켓(`chat:message`)으로 상대방이 보낸 선물 메시지 수신 시, 상대방 닉네임, 선물명, 포인트 및 3D 비디오/썸네일 이펙트를 FIFO 대기열에 자동 인큐하여 상단 배너와 함께 화면 전체에 애니메이션 연출.
  - 수신과 동시에 `fetchMyPoints()`를 즉시 호출하여 후원받은 포인트 잔액을 실시간 동기화.

### 2. 선물 메시지 전용 말풍선 렌더링 업그레이드
- **시각적 완성도 및 가독성 극대화**:
  - 선물 실제 썸네일 이미지(`thumbnailUrl` / `icon`) 인라인 렌더링.
  - 3D 비디오 VIP 선물인 경우 `3D VIP` 전용 배지 부착.
  - 전송 상태 구분: 내가 보낸 경우 "○○P 선물 보냄 🎁" (노란색 말풍선 맞춤 스타일), 상대방이 보낸 경우 "○○P 선물 도착 🎁" (흰색 말풍선 맞춤 스타일).
  - 선물 상세 설명 텍스트를 정돈된 줄간격과 가독성 높은 색상으로 노출.

### 3. 선물 모달 및 오버레이 컴포넌트 안전성 보강
- **`GiftPickerSheet.js` & `apiClient` (`client.js`)**:
  - `apiClient.getPointBalance()`를 공식 추가하여 유저 지갑의 실시간 사용 가능 포인트(`spendableBalance`)를 언제나 안전하게 불러오도록 연동.
  - 선물 바텀시트에서 보유 포인트와 선택한 선물의 가격을 정확히 비교하여 포인트 부족 시 충전 샵으로 즉시 유도.
- **`GiftEffectOverlay.js`**:
  - `senderNickname`/`senderName`, `giftName`/`name`, `pricePoints`/`amount`, `thumbnailUrl`/`icon` 등 다양한 페이로드 키에 대해 완벽한 fallback 처리 적용.

---

## 2026-10-01 Checkpoint 6: 인앱 알림 & 공지사항 센터 구축 및 홈 화면 알림 연동 (완료)

### 1. 백엔드 실시간 활동 알림 및 공지 피드 모듈 (`services/api/src/modules/notifications/`)
- **활동 알림 통합 피드 (`notifications.service.ts` & `notifications.controller.ts`)**:
  - `GET /notifications/activity` 엔드포인트 신설 (`JwtAuthGuard` 보호).
  - 유저의 실시간 활동을 단일 타임라인 피드로 정합·정렬하여 반환:
    - 🎁 **선물 수신 (`GiftTransaction`)**: 선물 보낸 사람 닉네임/아바타, 선물 상품명, 적립 포인트 실시간 안내.
    - 💳 **출금 상태 변경 (`SettlementRequest`)**: 신청 포인트 금액, 입금 승인 여부, 반려 사유 실시간 안내.
    - 👀 **프로필 방문 (`ProfileVisit`)**: 방문자 닉네임 및 아바타, 방문 시각 안내.
  - 날짜 역순(`desc`) 정렬 및 안전한 널 세이프 핸들링 적용.

### 2. 모바일 앱 알림 및 공지사항 센터 화면 (`apps/mobile/src/screens/main/NotificationsScreen.js`)
- **듀얼 탭 세그먼트 UX**:
  - 📢 **공지사항 탭**: 중요 공지 레드 배지, 부드러운 아코디언 토글(LayoutAnimation)을 통한 본문 확장/축소, 공지 등록 일시 포맷팅.
  - 🔔 **활동 알림 탭**: 선물, 출금, 프로필 방문 등 유형별 고유 컬러 아이콘 및 상대방 아바타 표시, 상대적 시간("방금 전", "15분 전" 등) 계산.
- **인터랙션 & 상태 관리**:
  - 당겨서 새로고침(Pull-to-refresh) 지원.
  - 알림 및 공지 미존재 시 세련된 빈 상태(Empty State) 일러스트/아이콘 UI 렌더링.

### 3. 네비게이션 및 홈 화면 연동 (`RootNavigator.js` & `HomeScreen.js`)
- **GNB 알림 아이콘 터치 연동**:
  - `HomeScreen.js` 상단 GNB의 종 모양 알림 아이콘 터치 시 `NotificationsScreen`으로 즉시 진입하도록 라우팅 연결.
- **스택 네비게이션 등록**:
  - `HomeStackNav` 및 `MyPageStackNav`에 `Notifications` 스크린 정식 등록 (우측 슬라이드 애니메이션 적용).
- **API 클라이언트 확장 (`client.js`)**:
  - `apiClient.getAnnouncements()` 및 `apiClient.getActivityNotifications()` 추가 (네트워크 오류 또는 데모 모드 시 안전한 fallback 목업 제공).

---

## 2026-10-01 Checkpoint 5: 관리자 유해 콘텐츠 제재 및 신고/안전 관리 센터(Safety Center) 고도화 (완료)

### 1. 백엔드 신고 및 제재 엔진 구축 (`services/api/src/modules/reports/`)
- **`ReportsService` & `AdminReportsController` (`reports.service.ts` & `admin-reports.controller.ts`)**:
  - **신고 상세 조회 확장**:
    - 신고 목록 페이징 및 최근 신고 조회 시 피신고자/신고자 프로필(닉네임, 아바타, 계정 상태, 신뢰도 점수)과 함께 신고된 게시글 내용(`content`, `mediaUrls`, 작성자)을 한 번에 결합 조회.
  - **`POST /admin/reports/:id/sanction-user` (피신고자 원클릭 제재 API)**:
    - `WARNING` (경고): 신뢰도 점수 5점 차감 및 주의 조치 기록.
    - `SUSPEND_7D` (7일 이용 정지): 계정 상태 `suspended` 전환, `tokenVersion += 1`로 모든 활성 기기 JWT 세션 즉시 만료 및 강제 로그아웃, 신뢰도 20점 차감.
    - `SUSPEND_30D` (30일 이용 정지): 30일간 서비스 이용 정지 및 세션 즉시 무효화.
    - `PERMANENT_BAN` (영구 제명): 계정 상태 `banned` 전환, 신뢰도 점수 0점 처리, 영구 차단.
    - 제재 처리 시 신고 상태를 `RESOLVED`(처리 완료)로 자동 변경하고 `AuditLog`에 관리자 감사 이력 영구 기록.
  - **`DELETE /admin/reports/:id/delete-post` (유해 게시글 즉시 강제 삭제 API)**:
    - 신고 대상이 커뮤니티 게시글인 경우, 관리자가 1클릭으로 해당 유해 게시글 및 연관 댓글/좋아요를 DB 트랜잭션으로 영구 삭제.
    - 삭제 후 신고 상태를 `RESOLVED`로 자동 갱신 및 `AuditLog` 기록.

### 2. 관리자 웹 신고 및 안전 센터 UI 전면 고도화 (`apps/admin/src/app/reports-safety/page.tsx`)
- **신고된 게시글 인라인 미리보기 컨테이너**:
  - 게시글 텍스트 및 첨부 사진(섬네일 그리드)을 신고 카드 내에서 즉시 확인 가능.
  - 새 창으로 원본 사진 확대 보기 지원 및 우측 상단에 **[게시글 강제 삭제]** 액션 버튼 배치.
- **피신고자 실시간 상태 배지 및 신뢰도 표시**:
  - 피신고자의 현재 상태(`🟢 정상` vs `🔴 정지/차단`) 및 신뢰도 점수(0~100점) 실시간 노출.
- **[유저 제재하기] 모달 다이얼로그**:
  - 4단계 제재 수위(경고, 7일 정지, 30일 정지, 영구 제명) 시각적 선택 카드 제공.
  - 관리자 제재 메모/사유 입력 및 적용 시 모든 활성 세션 즉시 만료 안내.
- **[유해 게시글 삭제] 확인 다이얼로그**:
  - 삭제 대상 게시글 내용을 최종 확인하고 안전하게 영구 삭제 처리.

---

## 2026-10-01 Checkpoint 4: 커뮤니티 피드 사진/미디어 업로드 및 실시간 좋아요(하트) 인터랙션 구축 (완료)

### 1. DB 스키마 및 마이그레이션 (`schema.prisma` & `20261001024500_add_post_likes_and_media`)
- **`Post` 모델 확장**:
  - `mediaUrls`: 첨부 사진/미디어 URL 배열 필드 (`TEXT[] @default([])`).
  - `likesCount`: 캐시된 좋아요 수 (`INTEGER NOT NULL DEFAULT 0`).
  - `likes`: `PostLike[]` 관계 필드.
- **`PostLike` 모델 신설**:
  - `id`: CUID 기본키.
  - `postId`, `userId`: 외래키 (Cascade 삭제 지원).
  - 복합 유니크 인덱스: `@@unique([postId, userId])`로 1인 1좋아요 보장.
  - 인덱스: `@@index([userId])`, `@@index([postId])`.
- **`User` 모델 관계 확장**:
  - `postLikes`: `PostLike[]` 1:N 관계 추가.

### 2. 백엔드 NestJS 피드/미디어 모듈 확장
- **`PostsService` & `PostsController` (`modules/posts/`)**:
  - `getPostInclude`: 현재 로그인 유저의 좋아요 여부(`isLiked`)와 게시글/댓글 수 즉시 조회.
  - `create`: 텍스트뿐만 아니라 `mediaUrls` 첨부 지원.
  - `POST /posts/:id/like` 엔드포인트 신설: `toggleLike` 트랜잭션을 통해 좋아요 등록/취소 및 실시간 `likesCount` 반환.
- **`MediaController` (`modules/media/media.controller.ts`)**:
  - `POST /media/post` 엔드포인트 신설: 최대 20MB 피드 이미지 업로드 지원.

### 3. 모바일 앱 커뮤니티 피드 고도화 (`apps/mobile`)
- **`apiClient` (`api/client.js`)**:
  - `uploadPostMedia(asset)`: 모바일 갤러리 이미지 업로드.
  - `togglePostLike(postId)`: 실시간 좋아요 토글 API.
  - `createPost`: `mediaUrls` 동시 전송 지원.
- **`CommunityFeedScreen.js`**:
  - **피드 사진 갤러리 렌더링**: 단일 사진 풀사이즈 및 다중 사진 가로 스크롤 캐러셀 지원.
  - **원터치 실시간 좋아요(하트)**: 누르는 즉시 낙관적 업데이트(Optimistic UI)로 즉시 빨간 하트 전환 및 좋아요 수 반영.
  - **사진 첨부 글쓰기 UX**: `expo-image-picker`를 활용하여 최대 5장까지 사진 선택, 미리보기 섬네일 스트립 및 개별 'X' 삭제 지원, 업로드 중 인디케이터 제공.

---

## 2026-10-01 Checkpoint 3: 아고라(Agora) 라이브 스트리밍 실시간 WebSocket 브로드캐스팅 및 룸 라이프사이클 동기화 구축 (완료)

### 1. 백엔드 라이브 실시간 브로드캐스터 구축 (`modules/live/live-realtime-publisher.service.ts`)
- **`LiveRealtimePublisher` 서비스 신설**:
  - `publishMessage`: 실시간 채팅, 하트(좋아요), 3D 선물 후원 이벤트를 룸 참여자 전체에 브로드캐스트.
  - `publishViewer`: 방 입장(`joinRoom`) 및 퇴장(`leaveRoom`) 시의 실시간 시청자 수(`viewerCount`) 즉시 동기화.
  - `publishEnd`: 호스트 종료(`endRoom`) 및 관리자 강제 종료(`forceEndRoom`) 시 종료 사유와 함께 룸 종료 이벤트 전파.
- **`LiveService` 통합**:
  - `sendMessage`, `sendGiftToRoom`, `joinRoom`, `leaveRoom`, `endRoom`, `forceEndRoom` 호출 시 자동으로 `LiveRealtimePublisher`를 통해 이벤트 발행.

### 2. WebSocket 게이트웨이 라이브 룸 확장 (`modules/ws/chat.gateway.ts`)
- **실시간 소켓 이벤트 핸들러 추가**:
  - `live:join`: 클라이언트가 특정 라이브 룸(`live:${roomId}`) 채널 룸에 조인.
  - `live:leave`: 클라이언트가 라이브 룸 채널을 나갈 때 룸에서 탈퇴.
  - `live:message`: 채팅 메시지 및 선물 수신 이벤트 sub-second 실시간 전송.
  - `live:viewer_count`: 시청자 수 증감 실시간 업데이트.
  - `live:ended`: 방송 종료 시 시청자들에게 퇴장 알림 및 이전 화면 복귀 유도.

### 3. 모바일 앱 실시간 라이브 연동 (`apps/mobile`)
- **`realtime/chatSocket.js`**:
  - `LIVE_SOCKET_EVENTS` (`AUTH_READY`, `JOIN`, `LEAVE`, `MESSAGE`, `VIEWER_COUNT`, `ROOM_ENDED`) 상수 추가.
- **`LiveRoomScreen.js` (실시간 방송 시청/송출 화면)**:
  - 라이브 룸 입장 시 자동으로 WebSocket 연결 및 `live:join` 구독.
  - 실시간 채팅 및 하트 수 실시간 즉시 렌더링.
  - **3D 선물 후원 수신 시 `GiftEffectOverlay`에 즉시 큐잉되어 화려한 풀스크린 애니메이션 재생**.
  - 실시간 시청자 수 인디케이터 즉시 갱신.
  - 호스트 또는 관리자가 방송을 종료하면 즉시 Alert 팝업 후 안전하게 뒤로가기 처리.
  - 네트워크 단절 대비 5초 간격 백업 폴링 병행.

---

## 2026-10-01 Checkpoint 2: 크리에이터 출금/환전 신청 및 관리자 정산 승인·원천징수(3.3%) 시스템 구축 (완료)

### 1. DB 스키마 및 마이그레이션 (`schema.prisma` & `20261001010600_add_settlement_request_foundation`)
- **`SettlementRequest` 모델 및 `SettlementStatus` 열거형 신설**:
  - `id`: CUID 기본키.
  - `activityAccountId`: 신청자 활동 계정 (외래키, `ActivityAccount.settlementRequests`).
  - `pointsAmount`: 신청 포인트 (1P = 1KRW).
  - `krwAmount`: 세전 환산 금액.
  - `taxAmount`: 원천징수 세액 (사업소득세 3% + 지방소득세 0.3% = 3.3% 자동 계산).
  - `netAmount`: 실수령 지급액 (`krwAmount - taxAmount`).
  - `bankName`, `accountNumber`, `accountHolder`: 입금 계좌 정보.
  - `status`: `PENDING`(대기 중), `APPROVED`(승인/송금완료), `REJECTED`(반려됨), `CANCELLED`(취소됨).
  - `adminMemo`: 관리자 송금 메모 또는 반려 사유.
  - `processedAt`, `processedById`: 승인/반려 시각 및 처리한 관리자 ID (`User.settlementsProcessed`).
  - 인덱스: `[activityAccountId, createdAt]`, `[status, createdAt]` 복합 인덱스 적용.

### 2. 백엔드 NestJS 금융 정산 모듈 구축 (`modules/settlement/`)
- **`SettlementService` (`settlement.service.ts`)**:
  - **사용자 출금 신청 (`createRequest`)**:
    - 최소 출금 신청 포인트 10,000P 검증 및 계좌 정보 유효성 검사.
    - 지갑의 출금 가능 잔액(`redeemableBalance`) 초과 여부 검증.
    - Prisma `$transaction`으로 `redeemableBalance` 차감 & `pendingEarnings` 가산.
    - `WalletLedgerEntry`에 `kind: 'debit'`, `source: 'settlement_request'` 금융 원장 무결성 기록.
  - **관리자 승인 (`adminApproveRequest`)**:
    - 요청 상태 `PENDING` 검증.
    - 지갑의 `pendingEarnings` 차감 및 `source: 'settlement_approved'` 금융 원장 기록.
    - `SettlementRequest` 상태를 `APPROVED`로 변경하고 감사 로그(`AuditLog`) 생성.
  - **관리자 반려 (`adminRejectRequest`)**:
    - 요청 상태 `PENDING` 검증 및 반려 사유 입력 필수화.
    - 대기 잔액 `pendingEarnings`에서 차감 후 크리에이터의 출금 가능 잔액 `redeemableBalance`로 전액 즉시 환원.
    - `WalletLedgerEntry`에 `kind: 'credit'`, `source: 'settlement_rejected_refund'` 금융 원장 기록.
    - `SettlementRequest` 상태를 `REJECTED`로 변경하고 사유 기록 및 감사 로그 생성.
- **`AdminController` & `SettlementController`**:
  - `GET /settlement/overview`: 유저 출금 가능 잔액, 대기 잔액, 최소 기준, 최근 신청 내역 조회.
  - `POST /settlement/requests`: 유저 출금 신청 엔드포인트.
  - `GET /admin/settlement/requests`: 관리자 출금 신청 목록 조회 (상태 필터, 검색, 페이징).
  - `POST /admin/settlement/requests/:id/approve`: 관리자 송금 승인 처리.
  - `POST /admin/settlement/requests/:id/reject`: 관리자 출금 반려 및 포인트 환원 처리.
  - `GET /admin/settlement/summary`: 요약 지표에 대기 신청 건수(`pendingSettlementsCount`) 및 대기 포인트 합계 반영.

### 3. 관리자 웹 정산 센터 전면 확장 (`apps/admin/src/app/settlement/page.tsx`)
- **출금 신청 전용 탭 신설 (`requests`)**:
  - KPI 상단 카드에 대기 중인 출금 신청 건수 실시간 배지 표시.
  - 출금 신청 목록 테이블: 신청일시, 크리에이터(닉네임/@핸들), 입금 계좌(은행, 계좌번호, 예금주), 신청 포인트, 세금(3.3%), 실수령액, 처리 정보.
  - 실시간 상태별 필터(전체, 대기 중, 승인 완료, 반려됨) 및 검색(예금주, 은행, 계좌번호, 닉네임) 제공.
- **[송금 승인] 모달 다이얼로그**:
  - 세전 금액, 원천징수세액(-3.3%), 실 지급액, 계좌 정보를 일목요연하게 확인하고 관리자 송금 메모(이체번호 등) 입력 후 1클릭 승인 처리.
- **[반려] 모달 다이얼로그**:
  - 반려 시 대기 잔액이 크리에이터 지갑으로 즉시 안전하게 환원됨을 안내하고 반려 사유 필수 입력 후 처리.

### 4. 모바일 앱 크리에이터 출금 신청 연동 (`apps/mobile`)
- **`apiClient`**: `getSettlementOverview()`, `requestSettlement(...)` 탑재.
- **`ShopScreen.js` (포인트 충전소 / 크리에이터 지갑)**:
  - 상단에 **[크리에이터 출금 / 환전]** 카드 배치: 출금 가능 수익(P)과 정산 심사 대기(P)를 분리 표시.
  - **[출금 신청]** 터치 시 슬라이드 업 모달 제공:
    - 출금 가능 잔액 실시간 확인 및 [전액 입력] 원터치 버튼.
    - 신청 포인트 입력 시 **3.3% 원천징수세액 및 실제 입금 예정액 실시간 자동 계산**.
    - 입금 은행, 계좌번호, 예금주명 입력 폼.
    - 최근 신청 내역 및 심사 상태(심사중/승인완료/반려됨) 표시.

---

## 2026-10-01 Checkpoint: 관리자 동적 외부 서비스 연동(소셜 로그인, PG/결제, 푸시 알림, Agora 라이브) 및 금융급 암호화 관리 시스템 구축 (완료)

### 1. 관리자 웹 설정 센터 (`/settings`) 전면 고도화
- **무중단 동적 연동**:
  - 사업자 등록 및 제휴 승인 후 발급받은 API 키·시크릿 키를 관리자 웹에서 등록하면, **서버 재배포 없이 즉시 실서비스에 반영**되는 동적 설정 아키텍처 완성.
- **금융급 보안 암호화 (AES-256-GCM)**:
  - 등록된 모든 민감 키는 백엔드 `admin-settings.crypto.ts`를 통해 AES-256-GCM으로 양방향 암호화되어 DB에 저장되며, 웹 화면에는 마스킹(`••••••••`)되어 원본이 절대 유출되지 않음.
- **4대 핵심 카테고리 IA & 대시보드 개편**:
  1. 💬 **소셜 로그인 (OAuth)**: 카카오(REST API 키, Secret), 네이버(Client ID, Secret), 구글(Web Client ID, Secret), 애플(Service ID, Team ID, Key ID, AuthKey).
  2. 💳 **결제 및 PG 연동**: 토스페이먼츠(Client/Secret Key), 포트원(Store ID, API Key, Secret), 인앱결제(Apple Shared Secret, Google Service Account JSON).
  3. 🔔 **실시간 푸시 알림**: Firebase FCM(프로젝트 ID, 서비스 계정 비공개 키 JSON), Apple APNs(Team ID, Key ID, AuthKey, Bundle ID).
  4. 🎥 **실시간 라이브 스트리밍 (Agora RTC)**: 아고라 라이브 App ID, App Certificate(기본 인증서).
  5. 🎁 **광고 및 리워드 정책**: AdMob 앱/단위 ID, 일일 시청 한도 및 출석/추천 포인트 보존.
- **운영자 편의 UX**:
  - 각 항목별 공식 개발자 센터(카카오, 네이버, 구글, 애플, 토스, 포트원, 파이어베이스, 아고라) 바로가기 외부 링크 제공.
  - 각 키의 실시간 등록 상태 (`🟢 등록됨` vs `⚪ 미등록`) 인디케이터 배지 표시.
  - 일괄 저장 및 저장값 초기화(안전 삭제) 지원.

### 2. 백엔드 NestJS 동적 연동 모듈 완성
- **`AdminSettingsService` (`admin-settings.service.ts` & `admin.module.ts`)**:
  - 소셜·결제·푸시·아고라 11종 기본 연동 키 자동 시드 및 모듈 간 공용 안전 복호화 헬퍼 `getDecryptedSetting(settingId)` 구축.
  - 다른 모듈(`auth`, `store`, `notifications`, `live`)에서 사용할 수 있도록 `AdminModule`에서 export 처리.
- **`LiveService` & `LiveModule` (`live.service.ts` & `live.module.ts`)**:
  - `AdminModule` 의존성 주입 후 `getRoomToken` 시 관리자에 등록된 `agora_app_id` 및 `agora_app_certificate`를 동적으로 복호화하여 RTC 방송 토큰 생성 및 발행.
- **`AuthService` & `AuthController` (`auth.service.ts` & `auth.controller.ts`)**:
  - `POST /auth/kakao`, `POST /auth/naver`, `POST /auth/google`, `POST /auth/apple` 엔드포인트 신설.
  - 관리자 키가 등록되면 실제 각 사 UserInfo API를 호출해 정품 인증, 미등록 시 개발/심사용 가상 계정 프로비저닝.
  - 신규 가입 시 단일 트랜잭션으로 User, Owner, ActivityAccount, Wallet 생성 및 1,000P 웰컴 포인트 지급.
- **`StoreService` & `StoreController` (`store.service.ts` & `store.controller.ts`)**:
  - `POST /store/purchases/toss/confirm` 및 `POST /store/purchases/portone/confirm` 엔드포인트 신설.
  - 관리자 등록 토스 시크릿 키 기반으로 공식 승인 API(`api.tosspayments.com/v1/payments/confirm`) 호출 및 금융 원장(`WalletLedgerEntry`) 입금 처리.
- **`NotificationsService` & `NotificationsModule` (`notifications.service.ts`)**:
  - 관리자에 등록된 `firebase_service_account_json`을 동적으로 읽어 Firebase Admin SDK 인스턴스를 실시간 초기화 및 FCM 푸시 발송.

### 3. 모바일 앱 연동 (`LoginScreen.js`, `AuthContext.js`, `client.js`)
- `apiClient`에 `loginKakao`, `loginNaver`, `loginGoogle`, `loginApple` 및 토스/포트원 승인 API 연동.
- `AuthContext`에 `socialLogin(platform, token)` 통합 래퍼 제공.
- `LoginScreen.js`의 5대 소셜 로그인 버튼 터치 시 백엔드 엔드포인트 호출 및 자동 세션 수립 연동.

---

## 2026-09-30 Checkpoint 4: 대화 목록 및 채팅룸 카카오톡 스타일 전면 리빌드 (완료)

### 1. 카카오톡 대화 목록 화면 리빌드 (`ChatsScreen.js` & `ChatListItem.js`)
- **카카오톡 GNB 헤더 (56px)**:
  - 볼드 **"대화"** 타이틀(22px, `#191919`) + 검색 돋보기 + 새 대화/친구 찾기(말풍선+) + 설정 톱니바퀴.
  - 돋보기 터치 시 부드럽게 토글되는 카카오톡 스타일 인라인 대화방 검색 바.
- **카카오톡 규격 대화 리스트 아이템 (`ChatListItem.js`)**:
  - **아바타**: 52px 원형 아바타 + 프로필 상태.
  - **타이틀 & 타임스탬프**: 볼드 16px `#191919` 닉네임 + 우측 상단 카카오톡 타임스탬프(`오후 2:30`, `어제`, `9월 28일`).
  - **마지막 메시지**: 13px `#71717A` 2줄 말줄임. 선물 메시지 시 `🎁 선물: [선물명] (000P)`로 예쁘게 파싱.
  - **안 읽음 뱃지**: 카카오톡 레드 알약 배지 (`#F04438`, 흰색 볼드 숫자 `1`, `99+`).
  - **인셋 구분선**: 좌측 아바타 폭만큼 띄운 카카오톡 인셋 디바이더 (`marginLeft: 82`, `#F2F3F5`).
- **친근한 카카오 감성 빈 상태**:
  - `새로운 대화를 시작해 보세요` + 카카오 옐로우 `[새로운 인연 찾기]` 버튼.

### 2. 카카오톡 1:1 채팅룸 전면 리빌드 (`ChatRoomScreen.js`)
- **채팅방 고유 배경**:
  - 기존 푸른 그라디언트 제거 → **카카오톡 시그니처 소프트 스카이블루 배경 (`#B2C7DA`)** 전면 적용.
- **카카오톡 상단 헤더 (52px)**:
  - 뒤로가기 화살표 + 상대방 닉네임(볼드 17px `#191919`) + 상대방 입력 중 실시간 인디케이터 + 즐겨찾기(별) + 사이드바 메뉴(햄버거 `menu-outline`). 헤더 배경도 `#B2C7DA`로 일체화.
- **날짜 구분선 (Day Separator)**:
  - 카카오톡 특유의 반투명 다크 타원형 캡슐 배지 (`backgroundColor: rgba(0, 0, 0, 0.16)`, 흰색 11px 텍스트, 예: `2026년 9월 30일 수요일`).
- **카카오톡 정석 말풍선 레이아웃**:
  - **내 메시지 (Mine)**:
    - **카카오 옐로우 `#FEE500`** 배경 + 텍스트 `#191919`.
    - 우측 상단 각진 말풍선 꼬리 (`borderRadius: 14, borderTopRightRadius: 2`).
    - 말풍선 좌측 하단에 **노란색 숫자 1 안 읽음 뱃지 (`#FEE500`)** + 전송 시간(`오후 3:12`).
  - **상대방 메시지 (Other)**:
    - 좌측 38px 아바타 + 아바타 우측 상단 닉네임 + **순백색 `#FFFFFF`** 말풍선 (`borderTopLeftRadius: 2`).
    - 말풍선 우측 하단에 전송 시간 배치.
- **하단 입력창 (Composer Bar)**:
  - 순백색 바닥 + 좌측 회색 원형 `+` 첨부 버튼 (`#707070`).
  - 중앙 연한 그레이 라운드 캡슐 인풋 (`backgroundColor: '#F5F5F5'`, 둥근 모서리) + 우측 선물 아이콘 버튼.
  - 전송 버튼: 텍스트 입력 시 **카카오 옐로우 원형 버튼 `#FEE500`** 및 선명한 화살표 아이콘 활성화.
- **첨부 메뉴 바텀시트**:
  - 카카오 옐로우 원형 아이콘과 라운드 카드 기반의 사진/동영상, 카메라, 선물하기 시트 적용.
- **안드로이드 하단 거대 흰색 여백 제거 및 밀착 맞춤 (완료)**:
  - **원인**: `SafeAreaView edges={['bottom']}`과 `inputContainer`의 `insets.bottom` 중복 적용, 그리고 안드로이드에서 `KeyboardAvoidingView behavior="height"` 충돌로 인해 입력창 아래에 120dp 상당의 거대한 흰색 공백이 발생하던 문제.
  - **조치**: `SafeAreaView`의 `edges`를 상단 노치(`['top']`)로만 한정하고, `KeyboardAvoidingView`의 `behavior`를 iOS 전용으로 분기(`Platform.OS === 'ios' ? 'padding' : undefined`), 안드로이드의 `inputContainer` 하단 패딩을 `8dp`로 최적화하여 카카오톡처럼 안드로이드 소프트키 네비게이션 바 바로 위에 군더더기 없이 딱 맞춤 정렬되도록 수정 완료.

---

## 2026-09-30 Checkpoint 3: 카카오톡 스타일 디자인 시스템 및 라이브·커뮤니티·소통 종합 홈 대시보드 리빌드 (완료)

### 1. 카카오톡 시그니처 컬러 시스템 전면 개편 (`colors.js` & `globals.css`)
- **모바일 테마 (`apps/mobile/src/theme/colors.js`)**:
  - 카카오 옐로우: `kakaoYellow: '#FEE500'`, `primary: '#F59E0B'`
  - 다크 차콜 / 블랙: `kakaoBlack: '#191919'`, `textPrimary: '#191919'`
  - 소프트 오프화이트/그레이: `background: '#F7F8FA'`, `border: '#E8EAED'`
  - 선명한 서브 액센트: LIVE 레드 `#EF4444`, 온라인 그린 `#10B981`, 인연 핑크 `#F43F5E`
- **관리자 웹 (`apps/admin/src/app/globals.css`)**:
  - 카카오 비즈니스 옐로우 HSL 토큰(`--primary: 48 98% 48%`, `--primary-foreground: 0 0% 10%`, `--background: 210 20% 98%`) 적용으로 모바일 앱과 관리자 콘솔 간의 일관된 브랜드 아이덴티티 수립.

### 2. 종합 홈 대시보드 전면 재설계 (`HomeScreen.js`)
기존의 단순 데이팅/채팅 카드 레이아웃에서 벗어나, 카카오톡 스타일의 깔끔한 정보구조와 라이브 방송·동네 커뮤니티가 융합된 종합 홈 대시보드로 리빌드 완료:
1. **카카오톡 GNB 헤더 (56px)**:
   - 볼드 "다가온" 로고 + 카카오 옐로우 포인트 잔액 칩(`✨ 1,000P`) + 검색(돋보기) + 알림(종).
2. **카카오톡 상단 웰컴 & 내 프로필 미니 배너**:
   - 내 아바타 + 닉네임 + 인증회원 배지 + "오늘도 즐거운 소통 해보세요 ✨" 미니 카드.
3. **4대 핵심 숏컷 그리드**:
   - 🔴 **실시간 라이브** (ON AIR 배지, 실시간 방송 보기)
   - 📰 **동네 피드** (우리 동네 일상 & 모임)
   - 💬 **새로운 대화** (채팅 목록 & 새로운 인연)
   - 🎁 **무료 포인트** (매일 출석 & 리워드)
4. **실시간 LIVE HOT 방송 쇼케이스**:
   - 가로 스크롤 캐러셀, 실시간 방송 썸네일, `● LIVE` 붉은 배지, 실시간 시청자 수, 호스트 정보, [나도 방송하기] 카드.
5. **지금 접속 중인 이웃 (카카오톡/인스타 스토리 아바타 링)**:
   - 실시간 온라인 🟢 불빛이 들어온 스토리 아바타 링 및 원터치 프로필/대화 연결.
6. **카카오톡 스타일 스마트 프로모션 배너**:
   - 4.5초 주기 자동 롤링 캐러셀, 이벤트 배지, 또는 프로필 완성 50P 리워드 안내 배너.
7. **동네 커뮤니티 이야기 피드**:
   - 토픽 필터 칩 (#동네친구, #취미소통, #일상수다, #핫플레이스), 실시간 피드 카드(작성자, 시간, 본문, 좋아요/댓글), [이야기 작성하기].
8. **안심 케어 24/7 보증 배지**:
   - 100% 본인 인증과 24시간 실시간 모니터링 안심 보증 안내.

### 3. 하단 탭바 & 온보딩 화면 카카오 스타일 완성
- **하단 탭바 (`RootNavigator.js`)**: 활성 탭 카카오 차콜 블랙(`#191919`) + 라이브 탭 LIVE 레드(`#EF4444`) 악센트 적용. 안드로이드 소프트키 높이 자동 회피 Safe Area 보장.
- **온보딩 화면 (`WelcomeScreen.js`)**: 카카오 옐로우(`#FEE500`) 메인 CTA 버튼 및 차콜 텍스트 적용.

---

## 2026-09-30 Checkpoint 2: 피그마/캔바 온보딩 스플래시 & 5대 소셜 로그인 + 테스트 간편 로그인 연동 (완료)

### 1. 피그마 & 캔바 디자인 규격 반영 감각적 온보딩 스플래시 (`WelcomeScreen.js`)
- **56px 표준 헤더 & 브랜드 타이포그래피**: 상단 브랜드 심볼(`다가온 DAGAON`) 및 '건너뛰기' 퀵 버튼.
- **3대 핵심 가치 인터랙티브 슬라이더**:
  1. 💬 **인연의 발견**: "새로운 사람이 다가오고, 새로운 이야기가 시작된다" (동네 이웃 & 관심사 기반 매칭)
  2. 🌟 **3D 실시간 라이브**: "감동을 선물하는 생생한 3D 실시간 라이브" (화려한 비디오 선물 & 소통)
  3. 🛡️ **안심 케어 24/7**: "언제나 안심할 수 있는 클린 & 세이프티 소통" (본인인증 & 실시간 AI 모니터링)
- **부드러운 모션 애니메이션**: 슬라이드 전환 페이드/이동 효과 + 페이징 인디케이터 도트 + 하단 '다가온 시작하기' 그라디언트 버튼 페이드인.

### 2. 종합 로그인 화면 및 5대 소셜 로그인 UI (`LoginScreen.js`)
- **공식 플랫폼 가이드라인 100% 준수**:
  - **카카오(Kakao)**: `#FEE500` 배경, `#191919` 텍스트, 카카오 공식 말풍선 심볼
  - **네이버(Naver)**: `#03C75A` 배경, `#FFFFFF` 텍스트, 네이버 볼드 'N' 심볼
  - **Apple**: `#000000` 배경, `#FFFFFF` 텍스트, 공식 애플 로고
  - **Google**: `#FFFFFF` 배경, `#E5E7EB` 테두리, `#1F2937` 텍스트, 구글 'G' 심볼
  - **휴대폰 번호 로그인**: `#F8FAFC` 배경, 테두리, 전화 아이콘 (터치 시 `PhoneEntryScreen` 즉시 연결)
  - **이메일 로그인 / 회원가입**: 모달 기반의 간편 가입 및 로그인 지원
- **안심 약관 고지**: 하단 이용약관 및 개인정보처리방침 안내 연결.

### 3. 상용 출시 시 제거가 용이한 독립형 테스트 간편 로그인 (`TestLoginButton.js`)
- **완벽한 컴포넌트 분리**: `apps/mobile/src/components/TestLoginButton.js`로 분리하여 상용 배포 시 단 1줄 주석 처리로 비활성화 가능.
- **원클릭 다이렉트 로그인**: 클릭 시 백엔드 `POST /auth/test-login`을 호출하여 `test_user@dagaon.com` / `다가온테스터` 계정의 JWT 토큰을 즉시 발급받아 세션 수립 후 메인 대시보드로 자동 진입.

### 4. 백엔드 NestJS 인증 API 확장 (`auth.service.ts` & `auth.controller.ts`)
- **`POST /auth/test-login` 엔드포인트 신설**: 테스트 유저 자동 프로비저닝 (지갑 생성, 1,000P 기본 지급, 프로필 생성) 및 유효한 JWT 토큰 발급.
- **빌드 검증**: `services/api`에서 `nest build` 성공 (exit code 0).

### 5. 라우팅 연결 및 모바일 검증
- **`RootNavigator.js`**: `AuthFlow`에 `Login` 스크린 추가 등록 완료.
- **구문 검사**: 모든 모바일 파일 `node -c` 검사 통과 (exit code 0).

### 6. 안드로이드 소프트키 네비게이션 바 겹침 해결 (Safe Area Insets 보정)
- **원인 분석**: 안드로이드 기기에서 3버튼 소프트키(홈, 뒤로가기, 최근 앱)가 켜진 상태에서 `tabBarStyle`의 높이와 하단 패딩이 고정값(64, 8)으로 지정되어 탭 바가 시스템 바 뒤에 가려져 터치되지 않던 문제.
- **수정 내용**: `RootNavigator.js`의 `MainTabs`에서 `useSafeAreaInsets`를 연동하여 기기별 소프트키 바 높이(`insets.bottom`)를 동적으로 반영(`bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 24)`, `tabHeight = 56 + bottomPadding`), 5개 탭 바가 소프트키 바로 위에 완벽하게 떠올라 편안하게 터치되도록 조치 완료.

---

## 2026-09-30 Checkpoint 1: 상용 출시급 전체 UX/UI & 선물·광고·대시보드 고도화 (완료)

### 1. 데이터베이스 & Prisma 마이그레이션 (DB Level: 100% Non-destructive)
- **신규 마이그레이션**: `20260930012507_add_gift_and_advertisement_foundation` 적용 완료.
- **`Gift` 모델 신설**: 
  - 선물 ID, 명칭, 포인트 금액, 아이콘, 3D 비디오 애니메이션 URL(`animationUrl`), 애니메이션 타입(`BANNER`, `FULLSCREEN_3D`), 카테고리(`SPECIAL`, `ROMANCE`, `CHEER`, `FUN`), 활성 여부(`isActive`), 정렬 순서(`sortOrder`) 마스터 테이블 구축.
- **`GiftTransaction` 모델 신설**: 
  - 선물 발신자(`senderAccountId`), 수신자(`recipientAccountId`), 라이브 방 ID(`liveRoomId`), 선물 수량 및 총액, 플랫폼 수수료(`feePoints`), 호스트 적립액(`hostPoints`), 감사 메시지(`message`)를 완벽히 보존하는 금융급 거래 원장.
- **`Advertisement` 모델 신설**: 
  - 자체 배너 및 프로모션 관리용: 제목, 설명, 이미지 URL, 타깃 링크 URL, 노출 지면(`HOME_BANNER`, `CHAT_HEADER`, `COMMUNITY_TOP`), 클릭수(`clickCount`), 노출수(`viewCount`), 상태(`ACTIVE`, `PAUSED`).
- **`ActivityAccount` 관계 필드 연동**: 보낸 선물 목록(`sentGifts`), 받은 선물 목록(`receivedGifts`) 정합성 연결.

### 2. 백엔드 NestJS API 서비스
- **Gifts 모듈 (`services/api/src/modules/gifts/`)**:
  - 기본 7종 상용급 선물 자동 시드 생성 (황금 하트, 반짝이는 별, 장미 꽃다발, 축하 샴페인, 스포츠카, 다이아몬드 성, 럭셔리 요트).
  - 공개 조회: `GET /gifts` (카테고리별 필터링 지원).
  - 관리자 CRUD: `POST /gifts`, `PATCH /gifts/:id`, `DELETE /gifts/:id`, `GET /gifts/admin/analytics`.
- **Chats 선물 원자적 트랜잭션 연동 (`chats.service.ts`)**:
  - 선물 전송 시 지갑 잔액 차감과 함께 `tx.giftTransaction.create` 실행 및 메시지 메타데이터에 3D 비디오 애니메이션 정보 자동 동봉.
- **Live 선물 원자적 트랜잭션 구현 (`live.service.ts` & `live.controller.ts`)**:
  - `POST /live/rooms/:id/gift` 엔드포인트 신설.
  - 시청자 지갑 차감 + 호스트 지갑 적립 + 시스템 원장 기록 + 룸 포인트 누적 + 선물 실시간 시스템 메시지 생성을 단일 DB 트랜잭션(`tx`)으로 보장.
- **Advertisements 모듈 (`services/api/src/modules/advertisements/`)**:
  - 기본 3종 배너 자동 시드 (첫 충전 200% 보너스, 다가온 안심 케어 캠페인, VIP 웰컴 기프트).
  - 지면별 활성 광고 조회 (`GET /advertisements?placement=HOME_BANNER`), 클릭수 기록 (`POST /advertisements/:id/click`).
  - 관리자 등록/수정/삭제 (`POST /advertisements`, `PATCH /advertisements/:id`, `DELETE /advertisements/:id`).
- **빌드 검증**: `services/api`에서 `nest build` 성공 (exit code 0).

### 3. 관리자 웹 콘솔 (Admin Web)
- **8대 한국어 정보구조(IA) 재정비**:
  - GNB/사이드바 메뉴를 상용 서비스 체계(대시보드, 회원 관리, 소셜·대화, 수익·선물, 광고·프로모션, 콘텐츠·안전, 운영·설정)로 한국어 전면 통일.
- **선물 마스터 관리 UI (`apps/admin/src/app/store/gifts/page.tsx`)**:
  - 상단 선물 현황 KPI 카드 4종 (총 등록 선물, 활성 선물, 누적 선물 전송액, 3D 애니메이션 적용 수).
  - 선물 등록/수정 모달 (명칭, 포인트, 아이콘, 3D 알파 비디오 URL, 카테고리, 활성 여부).
  - 원클릭 상태 전환(활성/비활성 스위치) 및 안전 삭제 기능.
- **자체 배너 광고 관리 UI (`apps/admin/src/app/ads-rewards/page.tsx`)**:
  - 자체 배너 관리 탭 신규 구축.
  - 노출 지면별 배너 등록/수정 모달, 실시간 노출수 및 클릭수 집계 테이블 제공.
- **빌드 검증**: `apps/admin`에서 `next build` 31개 전체 라우트 빌드 통과 (exit code 0).

### 4. 모바일 앱 (Mobile App)
- **브랜드 정체성 통일**: 공식 브랜드명 **"다가온 (DAGAON)"**을 앱 전반(온보딩, 약관, 홈 앱바, 설정)에 100% 일관되게 적용.
- **디자인 토큰 시스템**:
  - `typography.js`: Noto Sans KR 기반 Display, TitleLarge/Medium/Small, BodyLarge/Medium/Small, Caption, Button 계층 구축.
  - `spacing.js`: 8pt 그리드 간격 토큰(xxs ~ xxxl, screenPadding, cardGap, radius 등) 신설.
- **3D 선물 이펙트 오버레이 (`GiftEffectOverlay.js`)**:
  - `expo-video` 기반 투명 비디오 렌더링.
  - FIFO 순차 대기열(Queue) 시스템 탑재로 연타 선물 시에도 끊김 없이 순차 재생.
  - 보낸이 닉네임과 선물 이름이 부드럽게 등장하는 글래스모피즘 슬라이드 배너.
- **선물 선택 바텀 시트 (`GiftPickerSheet.js`)**:
  - 카테고리 탭(전체, 스페셜, 로맨스, 응원, 재미) 필터링.
  - 내 포인트 실시간 연동 및 부족 시 [충전] 원터치 이동.
  - 3D 효과 배지 및 연타 방지 쿨다운 적용.
- **실시간 라이브 & 1:1 대화방 선물 시스템 완성**:
  - `LiveRoomScreen.js`: 선물 버튼 터치 시 `GiftPickerSheet` 오픈, 원자적 선물 트랜잭션 전송, 실시간 수신 시 `GiftEffectOverlay` 자동 렌더링.
  - `ChatRoomScreen.js`: 1:1 채팅방 첨부 메뉴에서 `GiftPickerSheet` 연동 및 실시간 소켓 수신 시 3D 오버레이 큐 실행.
- **바텀 내비게이션 5개 표준 탭 정돈**:
  - [홈, 커뮤니티, 라이브, 대화, 마이]의 한국 소셜 앱 표준 5개 탭으로 정비.
  - '충전소' 탭을 불필요하게 차지하지 않고 각 화면(홈 헤더 칩, 선물 시트, 마이페이지)에서 원터치 충전소 진입 지원.
- **홈 화면(HomeScreen.js) 종합 대시보드화**:
  - 상단 헤더: "다가온" 브랜드 로고 + 실시간 내 포인트 잔액 칩(`myPoints.toLocaleString()P`) + 검색.
  - 동적 배너 캐러셀: 관리자가 등록한 `HOME_BANNER` 광고 실시간 연동, 자동 슬라이드, 터치 시 클릭수 집계 및 라우팅.
  - HOT 실시간 라이브 섹션: 현재 진행 중인 실시간 방송 썸네일, ON-AIR 태그, 시청자 수, 방송 타이틀 가로 스크롤 카드 제공.
  - 커뮤니티 이야기 피드 & 다가온 안심 케어 시스템 안내.
- **구문 검사**: 모든 모바일 핵심 파일 `node -c` 검사 통과 (exit code 0).

---

## Project

Repository:
https://github.com/sonjunho2/tokfriends.git

Local:
C:\Users\ION\Downloads\work\tokfriends

Official consumer brand:
DAGAON / 다가온

Tagline:
새로운 사람이 다가오고,
새로운 이야기가 시작된다.

## Last Verified Git Baseline

Last known working branch:
chore/mobile-sdk57-upgrade

Last verified project commit:
4e5796c14115454644a557a4359b234d02b9398eb
feat(auth): 피그마/캔바 감각 온보딩 스플래시 & 5대 소셜 로그인 + 테스트 간편 로그인 연동

Remote GitHub branch HEAD verified:
4e5796c14115454644a557a4359b234d02b9398eb

Parent commit:
11ba835b8502aa92c97302575306e5aa83093c5d

GitHub compare verified against base 11ba835b8502aa92c97302575306e5aa83093c5d:
- ahead by exactly 1 commit
- behind by 0 commits
- exactly 6 changed files
- apps/mobile/src/api/client.js
- apps/mobile/src/screens/main/ChatRoomScreen.js
- services/api/prisma/migrations/20260918095000_add_chat_message_idempotency/migration.sql
- services/api/prisma/schema.prisma
- services/api/src/modules/chats/chats.service.ts
- services/api/src/modules/chats/dto.ts

IMPORTANT:
Before resuming code work, re-run:
- git branch --show-current
- git status --short
- git log -1 --oneline

Do not assume the branch/SHA without verification.

## Completed

### Expo SDK 57
- Runtime dependency alignment complete
- expo-doctor 21/21 PASS
- Android build PASS
- Emulator app runtime PASS
- local Android SDK configuration fixed using ignored android/local.properties
- changes committed/pushed at 6992879...

### App/Admin/API/Prisma inventory
Completed.

### Local Prisma DB sync
Migrations present:
1. 20260901000000_initial_baseline
2. 20260903011612_allow_admin_null_profile_fields
3. 20260903013009_add_admin_profile
4. 20260903025431_add_admin_settings_storage
5. 20260908014500_add_user_token_version
6. 20260908044000_add_legal_documents
7. 20260914042731_add_owner_activity_account_foundation
8. 20260914050305_add_wallet_ledger_foundation
9. 20260914054641_add_rbac_audit_risk_foundation
10. 20260915025317_add_activity_social_graph_foundation
11. 20260915050503_add_activity_chat_identity_foundation
12. 20260915141108_fix_activity_chat_setnull_compatibility
13. 20260915161907_add_chat_message_history_index
14. 20260918095000_add_chat_message_idempotency

2026-09-18:
npx prisma migrate status
=> 14 migrations found
=> Database schema is up to date!

Activity social graph migration SHA-256:
0BF4DC41E50D9C9D04905FAE3807C4A38C70960B0AF10D27DEE3025B86636671

.gitattributes migration rule:
services/api/prisma/migrations/20260915025317_add_activity_social_graph_foundation/migration.sql text eol=lf

Activity social graph migration SHA-256 before/after apply:
MATCH PASS

Do not modify the applied activity social graph migration bytes.

RBAC migration applied checksum:
a9ff341e18d78f1d4b94c93652aa72ee06b571e7a0161bb8f49f5cade7746f51

DB migration checksum and migration.sql SHA256:
MATCH PASS

### Owner / ActivityAccount foundation
Completed 2026-09-14.

- Added backward-compatible Owner model
- Added backward-compatible ActivityAccount model
- Preserved existing User/auth/AdminProfile/Chat/Friendship/Post relationships
- Added legacy User bridge relations without mass foreign-key rewrites
- Backfilled every existing User into one Owner and one primary ActivityAccount
- Existing User rows remain unchanged
- User count: 2
- Owner count: 2
- ActivityAccount count: 2
- Primary ActivityAccount count: 2
- Owner/ActivityAccount legacy relationships verified PASS
- Prisma validate PASS
- Prisma migrate deploy PASS
- Prisma migrate status: database schema is up to date
- Prisma Client generation PASS
- NestJS API build PASS
- git diff --check PASS
- ESLint could not run because the existing API project has no ESLint configuration file
- Migration committed and pushed separately
- Commit: 84547983d9175bf26c03d6ad4d66583f2d85450e

### Wallet / Ledger foundation
Completed 2026-09-14.

- Added one Wallet per ActivityAccount
- Added spendableBalance, redeemableBalance, and pendingEarnings buckets
- Added append-oriented WalletLedgerEntry foundation with delta and post-transaction balance fields
- Added unique idempotencyKey support for duplicate transaction prevention
- Added source/reference/metadata fields for transaction provenance
- Preserved existing User.pointsBalance during the transition
- Preserved existing PointPurchase behavior and User relationship
- Backfilled every existing ActivityAccount with one Wallet
- Existing User.pointsBalance copied to Wallet.spendableBalance
- Non-zero legacy balances create an opening ledger entry
- Zero legacy balances do not create unnecessary opening ledger entries
- ActivityAccount count: 2
- Wallet count: 2
- Missing Wallet count: 0
- Total legacy balance: 0
- Total wallet spendable balance: 0
- Wallet relationship verification PASS
- Wallet balance preservation verification PASS
- Prisma validate PASS
- Prisma migrate deploy PASS
- Prisma migrate status: database schema is up to date
- Prisma Client generation PASS
- NestJS API build PASS
- Applied migration checksum verified against migration.sql
- Added .gitattributes rules to preserve applied Prisma migration line endings/checksums
- Owner migration pinned to CRLF; Wallet migration pinned to LF
- Migration checksum preservation fix commit: bb7e1c349e9f6887a2e8aaca79338281e00542b0
- Wallet/Ledger commit: 92133fbe258caa4a69bbadcc83f46a0d52712ae9

### RBAC / Audit / Risk foundation
Completed 2026-09-14.

- Added global AdminPermissionsGuard after JWT authentication
- Added explicit server-side admin permission metadata
- Added permission keys:
  - users.manage
  - reports.view
  - content.manage
  - refunds.view
  - refunds.manage
  - approvals.view
  - approvals.manage
  - settings.manage
- Protected admin/users with users.manage
- Protected admin/reports with reports.view
- Protected admin/announcements with content.manage
- Protected legal-document mutation with settings.manage
- Protected refund routes with refunds.view/refunds.manage
- Added default-deny behavior for admin routes missing explicit permission metadata
- Permission declaration is checked before SUPER_ADMIN bypass
- Added structured AuditLog fields: reason, context, metadata
- Added AdminApprovalRequest foundation
- Added approval states: PENDING / APPROVED / REJECTED / CANCELLED
- Added approval idempotency key support
- Added requester / decider attribution
- Enforced four-eyes rule: requester cannot approve or reject own request
- Added expiry handling for pending approvals
- Added admin approval API:
  - GET /admin/approvals
  - POST /admin/approvals
  - PATCH /admin/approvals/:id/decision
- Added structured transactional audit logging for user role changes
- Added structured transactional audit logging for refund create/approve/deny
- Hardened approval DTO validation
- Prisma validate PASS
- Prisma migrate status PASS
- NestJS API build PASS
- git diff --check PASS
- staged migration SHA256 verified against applied DB checksum
- Migration checksum MATCH PASS after staging
- Feature commit:
  44a8f634e00b1728b977a21cdbf36d7cb078604a
- GitHub remote branch HEAD verified at the same SHA
- Admin 2FA enforcement remains a later security task; it was not enabled here to avoid locking out current administration before the full 2FA flow exists.

### Mobile navigation foundation
Completed 2026-09-14.

- Main tabs changed to Home / Live / Chat / Points / My
- Home reuses HomeScreen
- Chat reuses ChatsScreen stack
- Points reuses ShopScreen without changing purchase logic
- My reuses the existing Settings/My stack
- Added minimal LiveScreen placeholder only
- Preserved AuthFlow and onboarding stack
- Updated mobile deep links for new tab route names
- Preserved technical ddakchin:// deep-link prefix
- Updated profile/chat navigation references from old tab names
- Home consumer brand changed from MJ톡 to DAGAON
- General tab active color set locally to #6D4AFF
- LIVE tab active color set to #FF3B6B
- Global theme colors were intentionally not changed in this commit
- No LIVE backend/LiveKit implementation
- No real Chat WebSocket implementation
- No API/Prisma/Admin changes
- Mobile Babel transform check PASS
- Mobile relative import check PASS
- expo-doctor 21/21 PASS
- git diff --cached --check PASS
- Feature commit:
  6e7ce46419719f199cb11cfbfc39f91889a3952f
- GitHub remote branch HEAD verified at the same SHA

### Admin navigation foundation
Completed 2026-09-15.

- Final Admin IA established:
  Dashboard / Members / Social / Chat / Live / Content /
  Points & Gifts / Ads & Rewards / Settlement /
  Reports & Safety / Analytics / Admin & Permissions / Settings
- Reused existing Admin routes for completed areas
- Added minimal placeholder routes:
  - /live
  - /ads-rewards
  - /settlement
  - /reports-safety
  - /admin-permissions
- Added shared AdminRouteShell for placeholder routes
- Preserved existing admin authentication/session behavior
- Updated Admin branding to DAGAON
- Admin primary/focus color aligned to #6D4AFF
- LIVE navigation accent uses #FF3B6B
- Reports & Safety navigation accent uses #E5484D
- Social navigation uses Shuffle icon
- No Admin business feature implementation added
- No API/Prisma/migration/dependency changes
- Next.js production build PASS
- TypeScript validation PASS
- 28/28 static pages generated successfully
- git diff --check PASS
- Feature commit:
  b2ce5bc982dfe56d5825971e3229eda14e59f3de
- GitHub remote branch HEAD verified at the same SHA

### Social friendship / block safety foundation
Completed 2026-09-15.

- 기존 User 기반 Friendship 호환 구조 유지
- Prisma schema/migration 변경 없음
- Follow / Interest / ProfileVisit는 이번 작업에 포함하지 않음
- 양방향 Block 존재 시 친구 요청 금지
- 친구 요청 수락 직전에도 양방향 Block 검사
- Block 방향을 오류 메시지로 노출하지 않음
- 양방향 Friendship 관계를 기준으로 accepted/requested 중복 생성 방지
- declined 관계만 존재하면 기존 declined 관계 삭제 후 재요청 허용
- 친구 목록/요청 조회에서 양방향 Block 상대 제외
- 사용자 차단 시 양방향 기존 Friendship 삭제
- Block 생성/upsert와 Friendship 삭제를 하나의 transaction으로 처리
- sendRequest / acceptRequest / block에 Serializable transaction 적용
- Prisma P2034 직렬화 충돌 시 최대 3회 재시도
- unblock 시 기존 Friendship 자동 복구 없음
- npx prettier --check PASS
- npx prisma validate PASS
- npm run build PASS
- git diff --check PASS
- Feature commit:
  ab97304fb5100cf4c2d3c913fb081ce07eb48df7
- GitHub remote branch HEAD verified at the same SHA

### Consumer account provisioning foundation
Completed 2026-09-15.

- 신규 일반 User가 생성될 때 Owner / Primary ActivityAccount / Wallet foundation을 함께 보장
- 기존 User 기반 authentication/API compatibility 유지
- role !== 'user' 계정은 consumer provisioning에서 제외
- Admin account creation flow는 변경하지 않음
- Owner는 legacyUserId 기준 idempotent provisioning
- ActivityAccount는 legacyUserId 기준 idempotent provisioning
- 신규 ActivityAccount는 isPrimary=true
- 기존 Owner / ActivityAccount 데이터는 불필요하게 덮어쓰지 않음
- Wallet은 ActivityAccount 기준 없을 때만 생성
- 기존 Wallet balance 및 ledger는 변경하지 않음
- 신규 Wallet의 spendableBalance는 transitional User.pointsBalance에서 초기화
- redeemableBalance / pendingEarnings는 0으로 초기화
- 신규 Wallet이며 User.pointsBalance > 0일 때만 opening WalletLedgerEntry 생성
- opening ledger source:
  consumer_foundation_provisioning
- opening ledger idempotency key:
  consumer-foundation:legacy-balance:<ActivityAccount.id>
- pointsBalance가 0이면 불필요한 ledger entry 생성하지 않음
- Email signup에서 User 생성 + foundation provisioning을 하나의 Prisma transaction으로 처리
- 정상 phone profile 생성에서 User + foundation + phoneVerification 완료를 같은 transaction으로 처리
- DISABLE_AUTH phone upsert 경로도 transaction + idempotent provisioning 적용
- 기존 auth API response shape 유지
- JWT payload / req.user / ActivityAccount selection은 이번 작업에서 변경하지 않음
- Prisma schema/migration 변경 없음
- npx prisma validate PASS
- npm run build PASS
- git diff --check PASS
- Feature commit:
  e679cb2e9882f462d6ae2d4a05ea11309f9cc5e1
- GitHub remote branch HEAD verified at the same SHA

### API JWT guard usage unification
Completed 2026-09-15.

- API JWT guard usage unification 완료
- 실제 서버는 services/api/src/app.module.ts의 global APP_GUARD에서
  services/api/src/modules/auth/jwt.guard.ts를 canonical guard로 사용
- CommunityController에서 ../../guards/jwt-auth.guard active usage 제거
- UsersController에서 ../auth/jwt-auth.guard active usage 제거
- legacy guard 파일 자체는 아직 삭제하지 않음
- PostsController는 기존 canonical jwt.guard.ts 사용 유지
- global guard가 non-@Public route 보호를 계속 담당
- npm run build PASS
- git diff --check PASS
- Feature commit:
  8693e94fcdddd44098dcd213d577add6806675d2
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount request context foundation
Completed 2026-09-15.

- canonical JwtStrategy에서 authenticated User 기준으로 ActivityAccount context resolve
- JWT payload 자체는 변경하지 않음
- JWT는 기존 `{ sub, tokenVersion }` 유지
- request.user 기존 필드 유지:
  - id
  - role
  - status
- request.user에 추가:
  - ownerId
  - activityAccountId
- consumer `role === 'user'`에서만 ActivityAccount context resolve
- active Owner만 사용
- active ActivityAccount 후보만 사용
- 후보 조건:
  - isPrimary === true
  - 또는 legacyUserId === current User.id
- primary 우선
- 이후 createdAt 오름차순
- 최대 1개 선택
- Owner 소유 범위 안에서만 account 선택
- Owner가 없거나 inactive이면:
  - ownerId = null
  - activityAccountId = null
- ActivityAccount가 없으면:
  - activityAccountId = null
- admin 등 role !== user:
  - ownerId = null
  - activityAccountId = null
- foundation 데이터가 없거나 inactive여도 기존 active User 인증은 실패시키지 않음
- account-scoped endpoint에서 non-null 강제는 아직 하지 않음
- Friendship / Chat / Community / Discover의 User-based compatibility는 유지
- single Prisma findUnique call with nested select로 구현
- 별도 Prisma API 호출은 추가하지 않음
- 실제 SQL query count / DB round trip 수는 아직 측정하지 않음
- npx prettier --check src/modules/auth/jwt.strategy.ts PASS
- npx prisma validate PASS
- npm run build PASS
- git diff --check PASS
- Feature commit:
  c4059b015242fd5309ff025e223d7ec79f422c7d
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount Social graph foundation
Completed 2026-09-15.

- Added ActivityAccount identity-based Social graph models:
  - Follow
  - Interest
  - ProfileVisit
- Follow:
  - followerAccountId / followingAccountId
  - unique account pair
  - createdAt indexes in both directions
  - self relation prevented by Follow_accounts_distinct CHECK
  - ActivityAccount deletion cascades
- Interest:
  - senderAccountId / targetAccountId
  - unique account pair
  - createdAt indexes in both directions
  - self relation prevented by Interest_accounts_distinct CHECK
  - ActivityAccount deletion cascades
- ProfileVisit:
  - visitorAccountId / visitedAccountId
  - no pair unique constraint so visit history is preserved
  - visitedAt indexes in both directions
  - self relation prevented by ProfileVisit_accounts_distinct CHECK
  - ActivityAccount deletion cascades
- Existing compatibility models remain unchanged:
  - Friendship remains User-based
  - Block remains User-based
  - Report remains User-based
- Chat was outside this work scope
- Migration: 20260915025317_add_activity_social_graph_foundation
- Migration applied successfully to the local database
- Total migrations: 10
- Database schema is up to date
- Migration SQL SHA-256:
  0BF4DC41E50D9C9D04905FAE3807C4A38C70960B0AF10D27DEE3025B86636671
- Migration uses `.gitattributes` rule `text eol=lf`
- Migration SHA-256 matched before and after apply
- Applied migration bytes must not be modified
- prisma format PASS
- prisma validate PASS
- prisma migrate status PASS
- API npm run build PASS
- git diff --check PASS
- Feature commit:
  98a6fc495f10bd23ae981d8f228147b7798872a8
- GitHub remote branch HEAD verified at the same SHA

### Follow API/service foundation
Completed 2026-09-15.

- Implemented ActivityAccount-based Follow APIs:
  - PUT /follows/:targetAccountId
  - DELETE /follows/:targetAccountId
  - GET /follows/:targetAccountId/status
  - GET /follows/:accountId/followers
  - GET /follows/:accountId/following
- Account-scoped Follow endpoints require req.user.activityAccountId
- Missing ActivityAccount context returns ForbiddenException("Active activity account required")
- JWT payload remains unchanged
- req.user.id is used for legacy User Block compatibility checks
- Follow creation policy:
  - self-follow rejected
  - actor ActivityAccount and Owner must be active
  - target ActivityAccount and Owner must be active
  - missing/inactive target uses a generic NotFound response
  - bilateral legacy User Block checked when target Owner.legacyUserId exists
  - Block direction is not exposed
  - compound followerAccountId_followingAccountId upsert provides idempotent follow
  - Block check and upsert run in a Serializable transaction
  - Prisma P2034 conflicts retry up to three times
- Unfollow uses idempotent deleteMany
- Missing, inactive, or blocked target does not prevent existing Follow cleanup
- Follow status:
  - only visible active targets are queried
  - blocked/inactive targets use the same NotFound response
  - self status returns following=false
  - following is determined from the compound pair
- Followers/following lists:
  - offset pagination with defaults offset=0 and limit=20
  - maximum limit=50
  - ordered by createdAt desc and id desc
  - take limit+1 used to calculate hasMore
  - inactive ActivityAccount and inactive Owner filtered out
  - bilateral Block counterpart Owners excluded in the Prisma where clause
  - Owners with legacyUserId=null are not hidden solely because the bridge is absent
- Consumer response exposes only:
  - id
  - handle
  - displayName
  - followedAt
- Consumer response does not expose ownerId, legacyUserId, or User.id
- CommunityService block integration:
  - existing Block upsert preserved
  - existing bilateral Friendship deletion preserved
  - both Users' Owners resolved by legacyUserId
  - all Follow rows between both Owners' ActivityAccounts deleted in both directions
  - deleted Follow rows are not restored by unblock
  - existing Serializable transaction and P2034 retry preserved
- Interest and ProfileVisit unchanged
- Prisma schema and migrations unchanged
- package/dependency, JWT strategy, Friendship service, Mobile, and Admin unchanged
- prettier write/check PASS
- prisma validate PASS
- Prisma Client generated before build
- npm run build PASS
- git diff --check PASS
- Final working tree clean after feature commit
- Feature commit:
  7babb3a7b8ef0c10d608df0475562e74c4508aab
- GitHub remote branch HEAD verified at the same SHA

### Interest API/service foundation
Completed 2026-09-15.

- Implemented ActivityAccount-based Interest APIs:
  - PUT /interests/:targetAccountId
  - DELETE /interests/:targetAccountId
  - GET /interests/:targetAccountId/status
  - GET /interests/sent
  - GET /interests/received
- Sent and received lists are private to the current req.user.activityAccountId
- No API exposes another ActivityAccount's sent or received Interest list
- Account-scoped Interest endpoints require req.user.activityAccountId
- Missing ActivityAccount context returns ForbiddenException("Active activity account required")
- JWT payload and JwtStrategy remain unchanged
- req.user.id is used for legacy User Block compatibility checks
- Interest creation policy:
  - self-interest rejected
  - actor ActivityAccount and Owner must be active
  - target ActivityAccount and Owner must be active
  - missing/inactive target uses a generic NotFound response
  - bilateral legacy User Block checked when target Owner.legacyUserId exists
  - Block direction is not exposed
  - compound senderAccountId_targetAccountId upsert provides idempotent send
  - Block check and Interest upsert run in a Serializable transaction
  - Prisma P2034 conflicts retry up to three times
- Interest remove uses idempotent deleteMany
- Missing, inactive, or blocked target does not prevent existing Interest cleanup
- Target visibility validation does not block remove
- Interest status:
  - only visible active targets are queried
  - blocked/inactive/missing targets use the same NotFound response
  - self status returns interested=false
  - interested is determined from the compound pair
- Sent/received lists:
  - sent contains Interest sent by the current ActivityAccount
  - received contains Interest received by the current ActivityAccount
  - offset pagination with defaults offset=0 and limit=20
  - maximum limit=50
  - ordered by createdAt desc and id desc
  - take limit+1 used to calculate hasMore
  - inactive counterpart ActivityAccounts and Owners filtered out
  - bilateral Block counterpart Owners excluded in the Prisma where clause
  - Owners with legacyUserId=null are not hidden solely because the bridge is absent
- Consumer response exposes only:
  - id
  - handle
  - displayName
  - interestedAt
- Consumer response does not expose ownerId, legacyUserId, or User.id
- CommunityService block integration preserves:
  - existing Block upsert
  - existing bilateral Friendship deletion
  - existing bilateral Follow deletion
- CommunityService block integration additionally:
  - reuses the existing Owner ActivityAccount ID arrays
  - deletes Interest rows in both directions between all ActivityAccounts of both Owners
  - performs Interest cleanup in the same Serializable transaction
  - does not restore deleted Interest rows after unblock
  - preserves existing Prisma P2034 retry behavior
- ProfileVisit and Follow files unchanged
- Prisma schema and migrations unchanged
- package/dependency, JWT strategy, Friendship service, Mobile, and Admin unchanged
- prettier write/check PASS
- prisma validate PASS
- npm run build PASS
- git diff --check PASS
- Final working tree clean after feature commit
- Feature commit:
  b92c26e6fc9bee590afc200b389d8a1737bae51d
- GitHub remote branch HEAD verified at the same SHA

### ProfileVisit API/service foundation
Completed 2026-09-15.

- Implemented ActivityAccount-based ProfileVisit APIs:
  - POST /profile-visits/:targetAccountId
  - GET /profile-visits/received
  - GET /profile-visits/sent
- All ProfileVisit endpoints require req.user.activityAccountId
- Missing ActivityAccount context returns ForbiddenException("Active activity account required")
- JWT payload and JwtStrategy remain unchanged
- req.user.id is used for legacy User Block compatibility checks
- Received and sent history are private to the current ActivityAccount
- No public API exposes another ActivityAccount's visit history
- Profile visit creation policy:
  - self-visit recording rejected
  - actor ActivityAccount and Owner must be active
  - target ActivityAccount and Owner must be active
  - missing/inactive target uses a generic NotFound response
  - bilateral legacy User Block checked when target Owner.legacyUserId exists
  - Block direction is not exposed
  - blocked target returns BadRequestException("Profile visit is unavailable")
  - Block check and ProfileVisit create run in a Serializable transaction
  - Prisma P2034 conflicts retry up to three times
- ProfileVisit preserves repeated visit history rather than an idempotent relation:
  - transaction.profileVisit.create() used for every visit
  - repeated visitorAccountId/visitedAccountId pairs are allowed
  - no upsert or dedupe
  - no pair unique constraint added
  - no aggregation or groupBy
  - history is not reduced to only the latest visit
  - raw visit events are retained
- Received history:
  - visitedAccountId is the current activityAccountId
  - every visit event is returned as a history item
- Sent history:
  - visitorAccountId is the current activityAccountId
  - every visit event is returned as a history item
- Counterpart ActivityAccount and Owner must be active
- Bilaterally blocked counterpart Owners are excluded in the Prisma where clause
- No JavaScript post-filtering creates pagination holes
- Owners with legacyUserId=null are not hidden solely because the bridge is absent
- Offset pagination uses:
  - default offset=0
  - default limit=20
  - maximum limit=50
  - visitedAt desc and id desc ordering
  - take limit+1 to calculate hasMore
- Consumer response items expose only:
  - id as the counterpart ActivityAccount.id
  - handle
  - displayName
  - visitedAt
- Consumer response does not expose:
  - ProfileVisit row id
  - visitorAccountId
  - visitedAccountId
  - ownerId
  - legacyUserId
  - User.id
- CommunityService block integration preserves:
  - existing Block upsert
  - existing bilateral Friendship deletion
  - existing bilateral Follow deletion
  - existing bilateral Interest deletion
- CommunityService block integration additionally:
  - reuses the existing Owner ActivityAccount ID arrays
  - deletes ProfileVisit rows in both directions between all ActivityAccounts of both Owners
  - performs ProfileVisit cleanup in the same Serializable transaction
  - prevents past visit history from remaining visible after block
  - does not restore deleted visit history after unblock
  - preserves existing Prisma P2034 retry behavior
- Follow and Interest files unchanged
- Prisma schema and migrations unchanged
- package/dependency, JWT/Auth, Friendship, Mobile, and Admin unchanged
- prettier write/check PASS
- prisma validate PASS
- npm run build PASS
- git diff --check PASS
- Final working tree clean after feature commit
- Feature commit:
  2482462c5c5e4fc9d5d38429220eef0db2e71e8c
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount Chat identity schema foundation
Completed 2026-09-15.

- Real Chat existing structure audit COMPLETE
- Real Chat DB data audit COMPLETE
- ActivityAccount Chat identity schema foundation COMPLETE
- Pre-implementation DB audit for the currently connected database:
  - User: 2
  - Owner: 2
  - ActivityAccount: 2
  - active ActivityAccount: 1
  - Chat: 0
  - Message: 0
  - Block: 0
  - Device: 0
- No duplicate legacy Chat, self Chat, or Message sender integrity issue was present
- No Chat or Message rows required backfill
- Audit results apply only to the currently connected database
- Environments containing legacy Chat data require the same audit before migration/backfill
- Existing legacy Chat identity remains required and unchanged:
  - userAId
  - userBId
  - userA User relation
  - userB User relation
- Added nullable ActivityAccount Chat bridge:
  - accountAId String?
  - accountBId String?
  - accountA ActivityAccount?
  - accountB ActivityAccount?
- ActivityAccount Chat foreign keys use onDelete: SetNull
- Existing User foreign keys were not removed or made nullable
- Added ActivityAccount inverse relations:
  - chatsAsAccountA
  - chatsAsAccountB
- Existing Message senderId and sender User relation remain required
- Added nullable Message sender bridge:
  - senderAccountId String?
  - senderAccount ActivityAccount?
  - onDelete: SetNull
- Added ActivityAccount inverse relation chatMessagesSent
- Added Chat constraints and indexes:
  - @@unique([accountAId, accountBId])
  - @@index([accountAId, lastMessageAt])
  - @@index([accountBId, lastMessageAt])
- Added Message index:
  - @@index([senderAccountId, createdAt])
- Application-level canonical participant ordering is not implemented yet
- Canonical ordering is reserved for the direct-room API slice
- No DB lexical ordering CHECK was added
- Initial migration:
  - 20260915050503_add_activity_chat_identity_foundation
  - applied successfully
  - SHA-256: DC6C67092415DD9F6BEDB6D01B0D376B47B6069870218C0226159C2EDA983DC0
  - DB checksum matches the migration file
  - migration.sql pinned to LF
  - applied migration bytes must never be modified
- Initial migration added nullable bridge columns, SetNull foreign keys, unique/indexes,
  the self-chat CHECK, and the original pair-complete CHECK
- A compatibility conflict was identified between the pair-complete CHECK and independent SetNull foreign keys
- Deleting one ActivityAccount could null only one bridge column and violate the pair-complete CHECK
- The applied initial migration was not edited
- Corrective migration:
  - 20260915141108_fix_activity_chat_setnull_compatibility
  - removes only Chat_activity_account_pair_complete_check
  - SHA-256: 242B2DD2050007CF23EB75FF34DAABF88A926E3C9DF468E9B5B222A7939E2159
  - DB checksum matches the migration file
  - migration.sql pinned to LF
  - applied migration bytes must never be modified
- Final DB constraint state:
  - Chat_activity_account_pair_complete_check absent
  - Chat_activity_account_self_check retained
  - Chat_accountAId_fkey retains ON DELETE SET NULL
  - Chat_accountBId_fkey retains ON DELETE SET NULL
  - account pair unique retained
  - accountA/list index retained
  - accountB/list index retained
  - Message senderAccount index retained
- Transitional nullable bridges may be partially null after ActivityAccount deletion
- New ActivityAccount Chat creation must set both participants together in application logic
- No User-to-ActivityAccount, Chat, or Message backfill SQL included
- No legacy Chat merge/deletion or Message movement included
- Total migrations: 12
- npx prisma migrate deploy PASS
- npx prisma migrate status PASS
- Database schema is up to date
- npx prisma validate PASS
- npm run build PASS
- git diff --check PASS
- services/api/src, existing Chat behavior, WebSocket, Community, Auth/JWT, Mobile,
  Admin, package/dependency, message list/read/unread, attachment, push, and realtime unchanged
- Final working tree clean after feature commit and push
- Feature commit:
  9ca3d214564331f09381613f91d1e1ef7fe2409a
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount-based direct-room API safety foundation
Completed 2026-09-15.

- POST /chats/direct now uses an ActivityAccount-aware compatibility boundary
- targetAccountId is preferred; targetUserId remains a legacy fallback
- Active actor/target ActivityAccount and Owner validation is enforced
- Legacy User bridge validation, self-chat prevention, and bilateral Block checks are enforced
- Canonical account/user ordering and safe room reuse are applied
- Serializable transaction with bounded P2034 and account-pair P2002 retry is used
- Consumer response exposes only Chat id and ActivityAccount public identity
- Existing GET /chats and POST /chats/message behavior remains legacy User-based
- Message list/realtime/read state/attachments/push/mobile integration remain out of scope
- npx prisma generate PASS; Prisma schema/migrations unchanged
- Prettier check PASS
- Prisma validate PASS
- API npm run build PASS
- git diff --check PASS
- Feature commit:
  c3f0521fa77937bfcbe90c391527b0512989cb49
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount-based Chat list identity foundation
Completed 2026-09-15.

- GET /chats uses canonical JwtStrategy user.id and user.activityAccountId context
- Requires an active actor ActivityAccount, active Owner, and active legacy User bridge
- Verifies actor Owner.legacyUserId equals the authenticated User.id
- Includes only fully bridged accountAId/accountBId Chat rows
- Excludes null/null legacy Chat and partial-null Chat rows
- The GET read path performs no lazy bridge, update, backfill, or merge
- Requires active counterpart ActivityAccount, Owner, and legacy User
- Excludes bilateral legacy User Block counterparts; no Friendship requirement is added
- Actor-side userAId/userBId alignment is filtered in Prisma where clauses
- Counterpart cross-relation legacy User alignment remains a post-filter; malformed rows are excluded
- General eligibility and Block filtering run before take:20, preventing invalid rooms from consuming normal list slots
- Ordering is lastMessageAt descending, then id descending; take 20 remains
- Pagination parameters for chat list, last-message preview, and unread/read state remain unimplemented; message history API is now provided separately
- Consumer response exposes only Chat id, counterpart ActivityAccount id/handle/displayName, and lastMessageAt
- Does not expose userAId, userBId, accountAId, accountBId, Owner.id, legacy User.id, Owner.legacyUserId, or Block/bridge data
- POST /chats/message remains legacy User-based; senderAccountId and atomic Message/lastMessageAt transaction are not yet implemented
- POST /chats/direct compatibility remains unchanged, including targetUserId legacy fallback
- Prettier check PASS
- Prisma validate PASS
- API npm run build PASS
- git diff --check PASS
- LF to CRLF warnings occurred for tracked source files but did not fail diff check
- Feature commit/push completed:
  2e0d48867ec52818c69cd0ee496c48cc68ee6907
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount-based message-send identity foundation
Completed 2026-09-15.

- POST /chats/message uses canonical JwtStrategy user.id and user.activityAccountId; user.sub fallback was removed
- Requires an active actor ActivityAccount, active Owner, and active legacy User bridge matching the authenticated User.id
- Permits send only for fully bridged accountAId/accountBId Chat rows; null/null and partial-null Chat sends are rejected
- The send path performs no lazy bridge, backfill, or merge
- Validates actor account participation and actor-side account/User alignment
- Requires an active counterpart ActivityAccount, Owner, and legacy User bridge
- Validates counterpart cross-relation account/User alignment; malformed Chat rows return ConflictException("Chat is unavailable")
- Rejects same-Owner ActivityAccount and same legacy User identity sends
- Rechecks bilateral legacy User Block inside the transaction; no Friendship requirement is added
- Message create and Chat.lastMessageAt update run in the same Serializable transaction
- Retries P2034 only, up to three times; all other errors are thrown unchanged
- Each transaction attempt creates one now value used for both Message.createdAt and Chat.lastMessageAt
- Records senderId as actor Owner.legacyUserId and senderAccountId as actor ActivityAccount.id
- Consumer response exposes id, chatId, senderAccountId, type, content, translatedContent, and createdAt only
- Does not expose senderId, isFlagged, Owner.id, Owner.legacyUserId, legacy User.id, or Block/internal bridge data
- SendMessageDto has no clientMessageId/idempotency key; HTTP/network retry deduplication remains unimplemented
- Message history API is now implemented; preview, unread/read state, edit/delete, attachment persistence, and push remain unimplemented
- WebSocket/Gateway remains legacy-based and was not changed
- Mobile ChatRoomScreen has no real HTTP send integration yet
- Existing GET /chats ActivityAccount list and POST /chats/direct compatibility/lazy bridge behavior remain unchanged
- Prettier check PASS
- Prisma validate PASS
- API npm run build PASS
- git diff --check PASS
- LF to CRLF warnings occurred for tracked source files but did not fail diff check
- Feature commit/push completed:
  89a71fa51b07f4ef5638ae2c19a9cdacd781be5e
- GitHub remote branch HEAD verified at the same SHA

### ActivityAccount-based message-history foundation
Completed 2026-09-15.

- Added GET /chats/:chatId/messages using canonical JwtStrategy user.id and user.activityAccountId; no user.sub fallback
- Requires an active actor ActivityAccount / Owner / legacy User exact bridge
- Consumer history permits fully bridged accountAId/accountBId Chat rows only; null/null and partial-null rooms are rejected
- Validates actor participation/alignment, active counterpart bridge, counterpart cross-relation alignment, and same Owner/same legacy identity malformed rooms
- Bilateral legacy User Block returns Chat not found without exposing Block direction or room existence
- No read-path lazy bridge, update, backfill, or merge; no Friendship requirement
- Uses composite createdAt + id cursor pagination, DB ordering createdAt desc then id desc, default limit 30, and max 50
- Uses limit + 1 for nextCursor; consumer items return oldest to newest and nextCursor is the current page oldest row
- Query validation errors are Invalid message cursor and Invalid message limit
- Public response exposes id, chatId, nullable senderAccountId, type, content, translatedContent, and createdAt only
- Does not expose senderId, isFlagged, Owner/User identity, Block, or internal bridge data
- A non-participant senderAccountId is returned as a null tombstone; sender handle/displayName/avatar are not joined
- Mobile and WebSocket/Gateway were not changed
- Unread/read, edit/delete, attachments, push, and clientMessageId/idempotency remain unimplemented
- Existing GET /chats, POST /chats/message, and POST /chats/direct behavior remains unchanged
- Added history pagination index migration: 20260915161907_add_chat_message_history_index
- Index: Message(chatId, createdAt, id)
- Migration checksum: 5872bf7a15efb822589b7aca73bbad898002baf52da7440519da4a52c8dad9a1
- Migration file uses LF with no BOM; existing applied migration bytes were unchanged
- Render production DB migration applied 2026-09-15: 13 migrations total; Database schema up to date
- The seven newly applied migrations all have applied_steps_count=1, finished_at present, and rolled_back_at=null
  - 20260914042731_add_owner_activity_account_foundation
  - 20260914050305_add_wallet_ledger_foundation
  - 20260914054641_add_rbac_audit_risk_foundation
  - 20260915025317_add_activity_social_graph_foundation
  - 20260915050503_add_activity_chat_identity_foundation
  - 20260915141108_fix_activity_chat_setnull_compatibility
  - 20260915161907_add_chat_message_history_index
- Render production DB read-only verification: User/Owner/ActivityAccount/Wallet counts are 3 each; WalletLedgerEntry, Follow, Interest, ProfileVisit, Chat, and Message counts are 0
- Owner legacy bridge, primary ActivityAccount bridge, and Wallet bridge verification passed 3/3
- Verified DB indexes: Message_chatId_createdAt_id_idx, Message_senderAccountId_createdAt_idx, Chat_accountAId_lastMessageAt_idx, Chat_accountBId_lastMessageAt_idx, and Chat_accountAId_accountBId_key
- Verified constraints: pair-complete check absent, self check retained, and Chat account plus Message senderAccount foreign keys use ON DELETE SET NULL
- Prettier PASS
- Prisma validate PASS
- API build PASS
- git diff --check PASS
- Feature commit/push:
  85d8b1a4d927293db6608e2fa98653168cac013f
- GitHub remote branch HEAD verified at the same SHA
- Render tok-friends-api currently deploys branch chore/api-recovery; this history API feature code is not yet deployed to the Render production API

### GET /users/me ActivityAccount identity foundation
Completed 2026-09-15.

- GET /users/me uses canonical JwtStrategy request context user.id
- The legacy user.sub fallback was removed from GET /users/me
- The existing `{ ok: true, data }` envelope and serializeUser fields are preserved
- Added `data.activityAccountId: string | null`
- activityAccountId reuses the canonical current ActivityAccount id already resolved by JwtStrategy
- No additional ActivityAccount database query was added
- UsersService.byId and serializeUser remain unchanged
- PATCH /users/:id response and GET /users/:id public serializer contracts remain unchanged
- ownerId, Owner.id, Owner.legacyUserId, ActivityAccount.ownerId, ActivityAccount.legacyUserId, and other internal bridge data are not exposed
- An authenticated User without ActivityAccount context still receives /users/me with activityAccountId=null
- Account-scoped non-null enforcement remains endpoint-specific
- Mobile AuthContext can use user.activityAccountId from its existing /users/me user state contract; Mobile files were not changed
- Chat APIs, Prisma schema, migrations, and the database were not changed
- npm run build PASS
- git diff --check PASS
- npx prettier --check src/modules/users/users.controller.ts FAIL because the unchanged HEAD version has the same existing formatting issue
- No whole-file formatting sweep was performed in this feature
- Feature commit/push:
  57542f2a7d6bd2bddd964a619a866c7306a0f872
- GitHub remote branch HEAD verified at the same SHA

### Mobile real Chat list HTTP integration foundation
Completed 2026-09-16.

- Added apiClient.getChats() to apps/mobile/src/api/client.js
- Added real GET /chats HTTP integration without client-side query, limit, pagination, or fallback routes
- Preserved the backend fixed take:20 behavior
- Removed the ChatsScreen dummy chat list
- Removed fake unread, preview/snippet, avatar, points, location/distance, age, new/favorite state, and related filters
- Uses the backend counterpart ActivityAccount identity
- Preserves counterpart.id as counterpartAccountId and does not treat it as a legacy User id or Owner id
- Chat title rule is `displayName || handle || "대화"`
- Added initial loading, error with retry, empty, and FlatList pull-to-refresh states
- ChatRoom navigation passes id, chatId, title, and counterpartAccountId
- ChatRoomScreen and INITIAL_MESSAGES were not changed
- Message history/send integration and WebSocket/realtime remain unimplemented on Mobile
- Backend/API, Prisma/schema/migrations, and dependencies were not changed
- Changed files:
  - apps/mobile/src/api/client.js
  - apps/mobile/src/screens/main/ChatsScreen.js
  - apps/mobile/src/components/ChatListItem.js
- Babel transform PASS for all three changed files
- Relative import verification PASS
- git diff --check PASS
- npx expo-doctor: 20/21 checks passed
- The remaining dependency compatibility warning was not introduced by this feature
- Existing package state: expo 57.0.22 (recommended 57.0.23), expo-image-picker 57.0.17 (recommended 57.0.18)
- No dependency upgrade was performed in this feature
- Feature commit:
  cbec8ac716fc3997dd511a8c57cfa8a17db88f10
- GitHub remote branch HEAD exact SHA verified at the same SHA

### Mobile ChatRoom message history HTTP integration foundation
Completed 2026-09-16.

- Added apiClient.getChatMessages(chatId) to apps/mobile/src/api/client.js
- Added real GET /chats/:chatId/messages HTTP integration with required chatId validation and encodeURIComponent path handling
- Added no fallback route and no client-side limit or cursor query; the backend default of 30 messages is used
- Preserves nextCursor in the API client but does not use it for Mobile UI pagination
- Removed ChatRoomScreen INITIAL_MESSAGES and changed the messages initial value to []
- Resolves the Chat id in order from route.params.chatId, route.params.id, then route.params.room.id
- Uses AuthContext user.activityAccountId as the current ActivityAccount identity with no legacy User id fallback
- Displays backend content in a text bubble and uses createdAt for the actual timestamp display
- Preserves the backend type as backendType while treating the screen message type as text in this slice
- Sets sender=me only when senderAccountId equals the current ActivityAccount id
- Sets another non-empty senderAccountId to sender=other
- Sets a null or unavailable senderAccountId to sender=unknown without treating it as the current user
- Does not display the counterpart Avatar for an unknown sender
- Added initial history loading, error with retry, and successful empty states
- Added request generation/ref handling to prevent stale async responses from updating state
- Cursor pagination/load-more, Mobile POST /chats/message integration, and WebSocket/realtime remain unimplemented
- Existing local attachment/media/gift/send UI was not converted to backend behavior
- Backend/API, Prisma/schema/migrations, and dependencies were not changed
- Changed files:
  - apps/mobile/src/api/client.js
  - apps/mobile/src/screens/main/ChatRoomScreen.js
- Babel transform PASS for both changed files
- Relative import verification PASS
- git diff --check PASS
- npx expo-doctor: 20/21 checks passed
- Only the existing dependency warnings remain: expo 57.0.22 (recommended 57.0.23), expo-image-picker 57.0.17 (recommended 57.0.18)
- No dependency upgrade was performed
- Feature commit:
  b5ddc292ca01887d637ccec0a9c55da9fc6fbb6a
- GitHub remote branch HEAD exact SHA verified at the same SHA

### Mobile ChatRoom message send HTTP integration foundation
Completed 2026-09-16.

- Added apiClient.sendChatMessage(chatId, content) to apps/mobile/src/api/client.js
- Added real Mobile POST /chats/message HTTP integration using only chatId and content in the request body
- Added no fallback endpoint, automatic retry, clientMessageId, or idempotency key
- Requires a trimmed non-empty chatId and blocks requests for empty trimmed content
- Validates the successful response contract
- Appends only the server-confirmed response to the ChatRoom messages state with no optimistic text append
- Requires sent.chatId to exactly match the current chatId before append
- Requires sent.senderAccountId to exactly match AuthContext user.activityAccountId before append, with no legacy User id fallback
- Prevents duplicate UI append using the server message id
- Clears input only after success and only when the current draft still matches the sent content
- Preserves a new draft entered while the request is in progress
- Preserves the existing input and adds no fake/local text message on failure
- Uses sendingMessage state to prevent duplicate submit
- Blocks text send while historyLoading or when historyError exists
- Scrolls toward the latest message after a successful send
- Preserved the existing appendMessage helper and local media and gift append behavior
- Attachment/media backend integration and financial Gift transactions remain unimplemented
- History cursor/load-more, WebSocket/realtime, unread/read, and push remain unimplemented
- Backend/API, Prisma/schema/migrations, and dependencies were not changed
- Changed files:
  - apps/mobile/src/api/client.js
  - apps/mobile/src/screens/main/ChatRoomScreen.js
- Babel transform PASS for both changed files
- Relative import verification PASS
- git diff --check PASS
- npx expo-doctor: 20/21 checks passed
- Only the existing dependency compatibility warnings remain: expo 57.0.22 (recommended 57.0.23), expo-image-picker 57.0.17 (recommended 57.0.18)
- No dependency upgrade was performed
- Feature commit:
  d659b43bb4c7d9d71802d0d34126648d64b99b96
- GitHub remote branch HEAD exact SHA verified at the same SHA

### Mobile direct-room explicit identity boundary
Completed 2026-09-16.

- Implemented after a READ-ONLY direct-room identity audit
- Confirmed /discover is based on Prisma.User and user.id remains a legacy User ID; it was not reinterpreted as an ActivityAccount ID
- Removed the positional/generic ensureDirectRoom(userId, options) contract
- Added explicit apiClient.ensureDirectRoom object contracts for exactly one of `{ targetUserId }` or `{ targetAccountId }`
- Trims targetUserId and targetAccountId independently and blocks the request when neither or both are present
- Includes exactly one identity in the POST /chats/direct request body
- Removed the participantId fallback while preserving the endpoint, response normalization order, and HTTP 410 handling
- Home preserves /discover user.id separately as targetUserId and passes it to ProfileDetail
- HotRecommend preserves /discover user.id as targetUserId and passes it to ProfileDetail
- ProfileDetail no longer uses profile.id or profile._id as direct-room identity
- ProfileDetail accepts only profile.targetUserId or profile.targetAccountId and calls the API only when exactly one is present
- The legacy path preserves `id: targetUserId` for current ChatRoom compatibility
- The ActivityAccount path does not copy the ActivityAccount ID into generic participant id
- GlobalProfileModal removed the profile.id/profile._id direct-room fallback and accepts only explicit targetUserId or targetAccountId
- GlobalProfileModal does not request a room when identity is missing or ambiguous; the audit found no current openProfile caller in apps/mobile/src
- Identity boundary: legacy User ID -> targetUserId, ActivityAccount ID -> targetAccountId, Chat ID -> chatId; these are not automatically reinterpreted
- Changed files:
  - apps/mobile/src/api/client.js
  - apps/mobile/src/components/GlobalProfileModal.js
  - apps/mobile/src/screens/main/HomeScreen.js
  - apps/mobile/src/screens/main/ProfileDetailScreen.js
  - apps/mobile/src/screens/recommend/HotRecommendScreen.js
- Babel transform PASS for all five changed files
- Relative import verification PASS
- git diff --check PASS
- npx expo-doctor: 20/21 checks passed with only the existing patch-version warnings
- Dependencies, backend/API, Prisma/schema, and migrations were not changed
- Feature commit:
  cdb59afd4c2f324893ebd24a504a1742ce87eaf5
- Parent commit:
  b610062ae41aeefaf8ce172e6ef986ea1584e059
- GitHub compare verified exactly one commit ahead with exactly five modified files and no other files
- GitHub remote branch HEAD exact SHA verified at the feature commit

### ActivityAccount-compatible Community report/block boundary
Completed 2026-09-16.

- Community Report and Block remain User-level DB policies; Prisma schema and migrations were not changed
- ReportDto now accepts optional targetAccountId while preserving targetUserId, postId, reason, and post-only reports
- ActivityAccount report targets are resolved internally through an active ActivityAccount, active Owner, Owner.legacyUserId, and active legacy User
- Report.reportedId stores only the resolved legacy User ID; ActivityAccount IDs are never persisted there
- When targetUserId and targetAccountId are both supplied, their resolved User identity must match
- Self-report is rejected and the existing Admin reported User relation is preserved
- BlockDto now accepts either optional blockedUserId or optional targetAccountId as a dual compatibility contract
- ActivityAccount block targets are resolved internally to a legacy User ID; Block.blockedUserId stores only that User ID
- Self and same-owner account targets resolve to the authenticated User and are rejected
- Existing Block upsert, bilateral Friendship cleanup, all-account Follow/Interest/ProfileVisit cleanup, Serializable transaction, and bounded P2034 retry behavior are preserved
- GET /community/blocks, DELETE /community/block/:blockedUserId, and BlockedUsersScreen are unchanged
- Mobile reportUser validates targetUserId, targetAccountId, postId, and reason; user-target reports reject simultaneous User and ActivityAccount identities while post-only reports remain supported
- Mobile blockUser accepts exactly one of blockedUserId or targetAccountId; unblockUser is unchanged
- ChatRoom report/block removed the generic user.id/user._id fallback and now accepts only user.targetUserId, user.targetAccountId, or route.params.counterpartAccountId
- counterpartAccountId is interpreted only as an ActivityAccount ID; conflicting account IDs or simultaneous User/account identities block the request
- ActivityAccount IDs are not copied into generic user.id
- Legacy Home/HotRecommend direct rooms continue to report/block through targetUserId
- Future targetAccountId direct rooms and current ChatsScreen rooms report/block through targetAccountId, with legacy User resolution confined to the server
- GET /chats did not need a legacy User ID response field
- Changed files:
  - apps/mobile/src/api/client.js
  - apps/mobile/src/screens/main/ChatRoomScreen.js
  - services/api/src/modules/community/community.controller.ts
  - services/api/src/modules/community/community.service.ts
- Backend Prettier, Prisma validate, and API build PASS
- Mobile Babel transforms and relative import verification PASS
- npx expo-doctor: 20/21 checks passed with only the existing patch-version warnings: expo 57.0.22 (recommended 57.0.23), expo-image-picker 57.0.17 (recommended 57.0.18)
- No dependency changes were made
- git diff --check PASS
- Feature diff: 187 additions, 34 deletions
- Feature commit:
  0b52bb35f62c59f002fc6d1599d056bf8e27173a
- Parent commit:
  c561303e3b488a95ed38942b247aef2e31a65cd4
- GitHub remote branch HEAD exact SHA verified at the feature commit

### ActivityAccount selection invariant audits
Completed 2026-09-16.

Configured DB READ-ONLY audit:
- User count: 2; Owner count: 2; ActivityAccount count: 2
- Active User: 1; active Owner: 1; active ActivityAccount: 1
- Duplicate active primary Owner: 0
- No usable candidate Owner: 0
- Bridge mismatch: 0
- Resolver/activityAccountBridge divergence: 0
- Ordering tie: 0
- CLEAN FOUNDATION
- Primary uniqueness is NOT DB enforced
- Configured DB had 12 applied migrations
- Latest configured DB migration: 20260915141108_fix_activity_chat_setnull_compatibility
- Tracked migration 20260915161907_add_chat_message_history_index was not yet applied to that configured DB
- No DB mutation or file modification was performed

Render production tokfriends-db READ-ONLY audit:
- Workspace: My Workspace; Postgres: tokfriends-db
- User count: 3 / active 3
- Owner count: 3 / active 3
- ActivityAccount count: 3 / active 3
- All three Owners have exactly one primary account
- Duplicate active primary Owner: 0
- No usable candidate Owner: 0
- Cross-owner bridge mismatch: 0
- Resolver/activityAccountBridge divergence: 0
- Ordering tie: 0
- No-primary resolver-null Owner: 0
- CLEAN FOUNDATION
- ActivityAccount.legacyUserId unique index exists
- ActivityAccount.ownerId_isPrimary index exists but is non-unique
- No primary partial unique index, isPrimary unique constraint, or custom primary-enforcing trigger/check exists
- PRIMARY UNIQUENESS NOT DB ENFORCED
- Applied migrations: 13
- Owner/ActivityAccount foundation and Chat history index migrations are applied
- Latest applied migration: 20260915161907_add_chat_message_history_index
- All queries were read-only and no DB mutation was performed

The configured DB and Render production DB are separate environments. The configured DB migration lag must not be interpreted as production DB lag; production was verified through the latest tracked Chat history index migration.

### Shared deterministic ActivityAccount target selection
Completed 2026-09-16.

- Added services/api/src/common/activity-account-selection.ts as a shared pure Prisma selection helper
- The helper contains no DB call, authentication, Owner validation, or transaction behavior
- Shared candidate predicate: active ActivityAccount where isPrimary is true or legacyUserId matches the requested legacy User ID
- Shared deterministic ordering: isPrimary DESC, createdAt ASC, id ASC
- id ASC is the final deterministic tie-breaker
- This does not resolve or normalize duplicate-primary data and is not a schema invariant change
- ChatsService.resolveLegacyTarget() remains in place
- Existing target User active, Owner active, exact bridge alignment, self, block, and transaction validation remain unchanged
- JwtStrategy authentication, tokenVersion, role, Owner, return-shape, and null semantics remain unchanged
- JWT and Chats share only the common candidate-selection primitive; actor current/default policy and target compatibility policy may evolve separately
- /discover was not changed
- Prisma schema, migrations, and dependencies were not changed
- Changed files:
  - services/api/src/common/activity-account-selection.ts
  - services/api/src/modules/auth/jwt.strategy.ts
  - services/api/src/modules/chats/chats.service.ts
- Prettier PASS
- Prisma validate PASS
- API build PASS
- git diff --check PASS
- Feature diff: 22 additions, 10 deletions
- Feature commit:
  f9bcbce8a5880537cb221a1bb3c02a46fc60bb01
- Parent commit:
  590e80d96c82174e2e96c11153f3be475f765100
- GitHub remote branch HEAD exact SHA verified at the feature commit

### Additive Discover target ActivityAccount identity
Completed 2026-09-16.

- `/discover` remains based on Prisma.User
- Existing User filtering remains unchanged: active role=user results, current-user exclusion, bilateral block filtering, gender, age, region, createdAt descending, and take 50
- `/discover.id` remains the legacy User.id
- Added the public `targetAccountId: string | null` field
- Users without a usable ActivityAccount remain in the existing discover result set with targetAccountId=null
- Target selection requires an existing active Owner with Owner.legacyUserId exactly aligned to User.id
- Candidate ActivityAccounts are active and either primary or linked by ActivityAccount.legacyUserId to User.id
- Deterministic ordering is isPrimary DESC, createdAt ASC, id ASC; only the first usable candidate ID is exposed
- Extended services/api/src/common/activity-account-selection.ts with buildDefaultActivityAccountOrderBy() and isDefaultActivityAccountCandidate()
- Existing buildDefaultActivityAccountSelection() remains available and now reuses the shared ordering helper
- Uses the existing User.findMany nested relation select; there is no per-user Prisma query or Promise.all query fan-out
- Actual SQL round-trip count was not measured
- ownerBridge and internal Owner/ActivityAccount status, primary, owner, and legacy bridge fields are stripped from the public response
- DiscoverController, Chats, JWT, Mobile, Community, Prisma schema, migrations, dependencies, and the database were unchanged
- Changed files:
  - services/api/src/common/activity-account-selection.ts
  - services/api/src/modules/discover/discover.service.ts
- Prettier PASS
- Prisma validate PASS
- API build PASS
- git diff --check PASS
- Feature diff: 68 additions, 13 deletions
- Feature commit:
  e2c75aeb1759750c11bd2312a2341e1d629dab85
- Parent commit:
  711f1bb3e08052e42689fcfc1b9851b197f694a7
- GitHub remote branch HEAD exact SHA verified at the feature commit

### Mobile Discover target ActivityAccount propagation
Completed 2026-09-16.

Home:
- mapHomeDiscoverUser preserves `id: user.id` as the legacy User ID
- Existing `targetUserId: user.id` remains fallback information
- Reads `/discover.targetAccountId`, trims string values, and does not treat empty strings as usable ActivityAccount IDs
- Stores a usable targetAccountId explicitly without copying it into generic id

HotRecommend:
- mapDiscoverUser applies the same identity rules
- Legacy User id and targetUserId fallback remain preserved
- targetAccountId uses trim/non-empty normalization

ProfileDetail navigation:
- Passes only `{ targetAccountId }` when a usable account target exists
- Otherwise passes only `{ targetUserId }` as the legacy fallback
- Never passes targetUserId and targetAccountId simultaneously
- Generic `id`, list keys, and display identity remain the legacy User ID

Compatibility:
- Existing `/discover.id -> targetUserId` fallback continues to work when production does not return targetAccountId
- Discover users are not removed when targetAccountId is absent
- ProfileDetailScreen, GlobalProfileModal, ChatRoom, ChatsScreen, apiClient.ensureDirectRoom, backend, Prisma schema, migrations, and dependencies were unchanged
- Changed files:
  - apps/mobile/src/screens/main/HomeScreen.js
  - apps/mobile/src/screens/recommend/HotRecommendScreen.js
- HomeScreen Babel transform PASS
- HotRecommendScreen Babel transform PASS
- Relative import validation PASS
- git diff --check PASS
- Feature diff: 34 additions, 2 deletions
- Feature commit:
  954959b0b83fc4e095fcb6c785ca34c43a6ced5d
- Parent commit:
  2136664e9664b464d89ef5549070ae6e22f684d4
- GitHub remote branch HEAD exact SHA verified at the feature commit

### Mobile profile/direct-room identity audit and deep-link cleanup
Completed 2026-09-16.

Audit findings:
- GlobalProfileModal reads only explicit `targetUserId` / `targetAccountId`, rejects missing or simultaneous identities, and has no generic `profile.id` / `profile._id` direct-room fallback.
- `openProfile` has no actual caller in the current Mobile source; GlobalProfileModal is mounted but its direct-room path is currently dormant.
- ProfileModalContext stores the supplied profile object without identity transformation or namespace inference.
- ProfileDetailScreen reads only explicit `targetUserId` / `targetAccountId`, rejects missing or simultaneous identities, and calls `ensureDirectRoom` with exactly one identity.
- Mobile `ensureDirectRoom` call sites are GlobalProfileModal and ProfileDetailScreen only; both preserve the exact-one contract.
- Home and HotRecommend preserve `/discover.id` as the legacy User identity, prefer explicit `/discover.targetAccountId`, and fall back to explicit `targetUserId` without passing both.
- ChatsScreen preserves `chat.id` as Chat ID and `chat.counterpart.id` as `counterpartAccountId`; ChatRoom keeps Chat and ActivityAccount namespaces separate.
- No generic-ID reinterpretation was found for `profile.id`, `profile._id`, `user.id`, `user._id`, or `counterpartAccountId` in a direct-room path.

Focused fix:
- Removed unsupported `Home.ProfileDetail -> home/profile` linking mapping.
- Removed unsupported `My.ProfileDetail -> mypage/profile` linking mapping.
- RootNavigator ProfileDetail screen registrations remain unchanged for Home and My stacks.
- Home, HotRecommend, and Settings internal ProfileDetail navigation remains available.
- No new URL identity contract, query parsing, generic ID parameter, profile fetch, or resolver was introduced.
- ProfileDetailScreen, GlobalProfileModal, ProfileModalContext, Home, HotRecommend, Settings, ChatsScreen, ChatRoomScreen, apiClient, backend, Prisma schema, migrations, dependencies, and docs outside this checkpoint were unchanged by the focused code fix.
- `src/navigation/index.js` Babel transform PASS.
- `git diff --check` PASS.
- Feature diff: 0 additions, 2 deletions.
- Feature commit:
  84584038832687e452656a4df542740647dced9e
- Parent commit:
  2612bd56dfbdb8942423939e51d4786472e12dd4
- GitHub remote branch HEAD exact SHA verified at the feature commit.

### Mobile Chat history cursor/load-more integration
Completed 2026-09-17.

- Mobile Chat history cursor/load-more integration COMPLETE
- API client `getChatMessages` now supports an optional backend cursor
- Initial history request remains cursor-free
- Older history uses the backend `nextCursor`
- Cursor pair:
  - `cursorCreatedAt`
  - `cursorId`
- Backend cursor values pass through without client reinterpretation
- Client does not send a custom limit; the backend default remains authoritative
- Backend page item order remains oldest -> newest
- Older pages are prepended without client-side sorting
- `message.id` based dedupe prevents duplicates
- Existing current message order is preserved
- Page-internal order is preserved
- Null/empty `nextCursor` stops further history requests
- Initial history loading/error state remains separate from older-history loading/error state
- Older-page failure does not discard already-loaded messages or globally block text sending
- Sender classification remains ActivityAccount-based
- No User ID / ActivityAccount ID namespace reinterpretation was introduced
- Stale request protection is preserved
- `maintainVisibleContentPosition` provides prepend scroll stability
- Unconditional content-size scroll-to-end was removed
- Initial history uses one-shot scroll-to-end
- Existing explicit text-send / local media / local gift scroll-to-end behavior is preserved
- Existing server-confirmed text-send behavior is preserved; no optimistic text send was added
- `apps/mobile/src/api/client.js` Babel transform PASS
- `apps/mobile/src/screens/main/ChatRoomScreen.js` Babel transform PASS
- Relative import verification PASS
- `git diff --check` PASS
- Exact staged files and numstat verified
- Local/origin SHA exact match verified
- Feature commit:
  bc0d2bfff56ca64ea4f4b04dfc5496b7ee667813
- Parent commit:
  71668b45014d17299cca81ba36d88394c46004b5
- Known limitation: actual-device scroll feel/behavior remains pending runtime UX verification on a physical device; this is not a known functional failure.

### 1:1 Chat realtime runtime and device validation
Completed 2026-09-17.

- Chat WebSocket gateway is activated on the working branch
- Socket.IO authentication uses JWT and resolves server-side ActivityAccount identity
- HTTP remains the message persistence path; WebSocket is the realtime delivery path
- Server derives sender identity; the client does not choose senderAccountId
- Room authorization is enforced before join and typing events
- Local positive end-to-end Chat runtime smoke PASS
- Missing/invalid WebSocket token rejection PASS
- Unauthorized room join rejection PASS
- Authorized typing event delivery PASS
- Unauthorized typing rejection PASS
- Room leave behavior PASS
- Physical Android device A and Android emulator B ran Expo Go 57.0.9
- Local API / OTP proxy / Metro connectivity was verified through explicit ADB reverse rules
- Physical-device phone OTP onboarding and profile completion PASS
- Real Mobile direct-room creation PASS
- HTTP message send and DB persistence PASS
- Stored history reload PASS
- B -> A realtime WebSocket delivery PASS
- A -> B realtime WebSocket delivery PASS
- Room re-entry preserved persisted messages
- message.id based Mobile dedupe showed no duplicate messages after re-entry
- Core 1:1 Chat device path is runtime-validated locally
- This does not mean the working branch is deployed or production-ready
- Gateway activation commit:
  057451c9b61b5012e34420aad6496b2ffe3cc3ae

### Phone signup ActivityAccount auth refresh fix
Completed 2026-09-17.

- Device testing found that a newly registered phone user could reach Home but ChatRoom initially reported missing active profile information
- Root cause: ProfileRegistrationScreen passed response.user directly to authenticateWithToken
- That bypassed the canonical /users/me refresh that supplies activityAccountId
- ProfileRegistrationScreen now calls authenticateWithToken(token)
- authenticateWithToken therefore loads canonical /users/me state immediately after phone signup
- Fresh test user C completed signup and sent a Chat message without restarting Expo Go
- Regression verification PASS on Android emulator
- Changed file:
  - apps/mobile/src/screens/auth/ProfileRegistrationScreen.js
- Fix commit:
  4d92f7b97c579e0510d2b8dacb66ed2f26b6f4b0
- Parent commit:
  057451c9b61b5012e34420aad6496b2ffe3cc3ae
- GitHub remote branch HEAD independently verified at the fix commit

### Mobile 1:1 Chat typing indicator
Completed 2026-09-17.

- The server `chat:typing` contract was already implemented
- Mobile now emits typing using exactly `{ chatId, typing }`
- `senderAccountId` remains server-derived
- Mobile ignores self, malformed, wrong-chat, and conflicting counterpart identity typing events
- Local typing idle timeout: 1500 ms
- Remote lost-false safety expiry: 3000 ms
- The header switches between "온라인" and "입력 중..."
- HTTP message persistence was not changed
- `chat:message` persistence/realtime behavior was not changed
- Message history/pagination was not changed
- No backend, schema, migration, or package change
- Real-device runtime verification:
  - C -> A typing indicator PASS
  - idle timeout -> online PASS
  - clearing input -> immediate online PASS
  - send while typing -> immediate online PASS
  - sent message appeared exactly once PASS
  - A -> C typing indicator PASS
  - leaving ChatRoom while typing -> immediate online PASS
  - force-closing sender app without normal `typing: false` -> remote indicator cleared by ~3 second expiry PASS
- This is local physical-device/emulator validation, not production deployment readiness
- Implementation commit:
  2cec1a269262ef78bab99a9366e1327268c7915d

### Phone signup optional-avatar ActivityAccount state preservation
Completed 2026-09-17.

- A read-only source audit confirmed a deterministic source-level state overwrite bug in the optional-avatar phone signup path
- `authenticateWithToken(token)` correctly fetched canonical `GET /users/me` state containing `activityAccountId`
- Mobile `apiClient.updateUser()` calls `PATCH /users/:id`
- `PATCH /users/:id` returns `serializeUser(updated)`, which does not add `activityAccountId`
- AuthContext `setUser()` replaces the user object rather than merging it
- The old avatar-selected path could therefore overwrite canonical `/users/me` state with the PATCH response and remove `activityAccountId` from in-memory AuthContext until a later canonical refresh/restart
- `User.id`, `Owner.id`, `ownerId`, and `legacyUserId` are not ActivityAccount IDs and were not reinterpreted as such
- The smallest safe fix was implemented only in `apps/mobile/src/screens/auth/ProfileRegistrationScreen.js`
- The avatar path now:
  1. uploads the avatar
  2. PATCHes the User avatar
  3. discards the noncanonical PATCH response
  4. calls `apiClient.getMe()`
  5. stores the canonical response using `setUser(canonicalMe)`
- AuthContext behavior was not changed
- `apiClient` behavior was not changed
- Backend/API serialization was not changed
- Prisma/schema/migrations were not changed
- Package dependencies were not changed
- Implementation diff is exactly +3 / -2 in one Mobile file
- Babel/static transform validation PASS
- `git diff --check` PASS
- Runtime verification:
  - Local Cloudinary media configuration was required to exercise the avatar path
  - Cloudinary credentials were supplied only as local process environment values for testing
  - No Cloudinary credential or secret was added to Git-tracked files
  - Cloudinary read-only authentication check eventually PASSed after correcting the local credential input
  - Local API `/v1/health` PASS with database ok
  - Fresh phone signup with a selected avatar completed successfully with no avatar error popup
  - Expo Go was not restarted after signup
  - The new user entered Chat successfully without an active-profile/`activityAccountId` error
  - One test message appeared exactly once locally
  - The counterpart received the message in realtime
- This verifies that the optional-avatar signup path preserves the currently required ActivityAccount Chat state for the tested local path
- This remains local physical-device/emulator validation, not production deployment readiness
- Implementation commit:
  e39fda3c6f0e4e94eeb7eed93371927e6ec45f88
- Parent commit:
  1844e2896536b61702fd24690015d3d283001d47
- GitHub remote branch HEAD independently verified at the implementation commit

### Real Chat clientMessageId / message idempotency
Completed 2026-09-18.

- Added nullable `Message.clientMessageId` as `VARCHAR(128)`
- Added unique constraint on `(senderAccountId, clientMessageId)`
- Migration: `20260918095000_add_chat_message_idempotency`
- DTO accepts optional, non-empty string `clientMessageId` with max length 128
- `senderAccountId` remains server-derived and is not accepted from the client
- Existing authentication, membership, ActivityAccount alignment, and block validation remain ahead of idempotency reuse
- Same `senderAccountId + clientMessageId` with the same chat/content returns the existing canonical Message
- Exact retry does not create a new Message row
- Exact retry does not update `Chat.lastMessageAt`
- Exact retry does not republish realtime
- Reusing the same key with different chat/content returns Conflict
- Prisma P2002 recovery re-reads the committed canonical Message for the idempotency key
- Unrelated P2002 errors are not swallowed
- Existing Serializable/P2034 retry behavior remains in place
- Clients without `clientMessageId` remain backward-compatible
- Mobile creates one UUID v4 per logical send
- Failed retry with unchanged chat/content reuses the same pending `clientMessageId`
- Editing the input or completing a successful send discards the pending ID
- Canonical server `Message.id` remains the Mobile UI dedupe identity
- Realtime payload/identity contract was not expanded
- Local validation:
  - `prisma validate` PASS
  - `prisma generate` PASS
  - API build PASS
  - Mobile static validation PASS
  - `git diff --check` PASS
  - local Prisma migration status: up to date
  - physical-device first send PASS
  - identical HTTP request replay PASS
  - replay returned the same canonical `Message.id`
  - content row count remained 1 -> 1
  - same `senderAccountId + clientMessageId` row count remained 1
  - `Message.id`, `Message.createdAt`, and `Chat.lastMessageAt` remained unchanged
  - no unexpected Message row was created
  - no duplicate message appeared on the phone
- Implementation commit:
  6a55defb16bb81b15b9691657adb4e45536cff3c
- Parent commit:
  11ba835b8502aa92c97302575306e5aa83093c5d
- GitHub remote branch HEAD independently verified at the implementation commit before this checkpoint update

### Production deployment limitation

- The working-branch 1:1 Chat realtime Gateway and local physical-device/emulator validation are not a production deployment claim.
- The phone-signup ActivityAccount auth refresh fix at 4d92f7b97c579e0510d2b8dacb66ed2f26b6f4b0 is verified on the working branch but is not claimed to be present in a released production app.
- The Mobile Chat typing indicator at 2cec1a269262ef78bab99a9366e1327268c7915d is locally device-validated working-branch code; this does not claim it is live in the released production app or API.
- The optional-avatar ActivityAccount state-preservation fix at e39fda3c6f0e4e94eeb7eed93371927e6ec45f88 is verified on the working branch with local device testing; this does not claim the fix is present in a released production app or production API.
- The Chat clientMessageId/idempotency implementation at 6a55defb16bb81b15b9691657adb4e45536cff3c is verified against the local DB and physical-device/local HTTP replay path; this does not claim it is deployed to the released production app or production API.
- Cloudinary credentials used for the local test were local development/runtime configuration only, not repository configuration; production media credential/configuration readiness remains a separate deployment concern.

- Render production tokfriends-db has the latest tracked migrations applied and its ActivityAccount invariants were verified as CLEAN FOUNDATION.
- Render tok-friends-api currently deploys branch chore/api-recovery.
- The shared deterministic selector, additive `/discover targetAccountId`, ActivityAccount Chat list/direct-room/history/send code, Community report/block ActivityAccount compatibility, and the GET `/users/me activityAccountId` contract on this working branch are not yet live on the Render production API.
- Mobile targetAccountId propagation and the ProfileDetail deep-link cleanup are working-branch Mobile code; this checkpoint does not claim they are present in a released production app.
- Mobile Chat history cursor/load-more is working-branch Mobile code; this checkpoint does not claim it is present in a released production app.
- The Agora provider decision is an architecture decision only; Agora SDK integration and production LIVE readiness are not complete.
- Mobile fallback behavior remains compatible with a production API that does not yet return `targetAccountId`, but production-endpoint E2E verification remains limited until the API deployment branch changes.

### Local test infrastructure note

- The local API currently requires Cloudinary process environment configuration to exercise `/media/avatar`
- Cloudinary credentials are not committed to the repository and must never be recorded in this checkpoint
- Do not assume local Cloudinary process environment values persist after PowerShell or API restart
- The canonical local API health path is `/v1/health`
- Transient local test configuration is not production configuration
- A temporary local HTTP debug proxy was used only for the 2026-09-18 idempotency replay verification; it is not repository code and is not production configuration

### Final high-level IA
Mobile main tabs:
Home / Live / Chat / Points / My

Admin:
Dashboard / Members / Social / Chat / Live / Content /
Points & Gifts / Ads & Rewards / Settlement /
Reports & Safety / Analytics / Admin & Permissions / Settings

### Figma-level design specification
High-level UX/design specs completed for:
- common design system
- Home
- Live
- Chat
- Points
- My
- Profile
- Search
- Notifications
- Auth/Onboarding
- permission/error/maintenance states
- Admin desktop layout

## Current Architecture Findings

### LIVE provider decision

- LIVE media provider for the initial commercial launch: Agora
- Self-hosted LiveKit is deferred and outside the current implementation scope
- Self-hosted LiveKit or another media architecture may be reconsidered after commercial growth provides sufficient usage and cost evidence
- Agora is the media transport/provider layer; DAGAON business logic must not become Agora-dependent
- DAGAON API/DB remains authoritative for room and broadcast metadata, permissions, service state, Wallet/Ledger, gifts, reporting/blocking/moderation, and Admin operations
- The DAGAON server should own required Agora token issuance
- This is an architecture/provider decision, not completed Agora SDK integration, a completed LIVE backend, or a production-readiness claim

### Mobile
Current tabs:
Home / Live / Chat / Points / My

Reusable:
- Home discover API
- ProfileDetail direct-room creation
- Chat image/video picker
- Chat gift options UI
- report/block
- Point product/IAP purchase flow
- current Settings/My shell

Current ActivityAccount identity contract:
- The backend /users/me contract now provides activityAccountId.
- AuthContext can consume user.activityAccountId without a structural change.
- The phone-signup optional-avatar path now rehydrates canonical `/users/me` after the avatar PATCH before replacing AuthContext user state, preserving `activityAccountId` in the validated local path.
- Mobile Chat list, ChatRoom history, and ChatRoom text send now use ActivityAccount identity.
- /discover response id remains a legacy User ID and its additive targetAccountId is an explicit nullable ActivityAccount action target.
- Users without a usable target account remain in discover results with targetAccountId=null.
- Home and HotRecommend now consume /discover targetAccountId while preserving /discover.id as the legacy User ID for display and list identity.
- Home and HotRecommend preserve targetUserId only as fallback information.
- ProfileDetail navigation receives exactly one direct-room identity: targetAccountId when usable, otherwise targetUserId.
- ActivityAccount IDs are not copied into generic id, and old production responses without targetAccountId remain compatible.
- ProfileDetailScreen remains unchanged and already rejects simultaneous targetUserId and targetAccountId.
- GlobalProfileModal also accepts explicit targetUserId or targetAccountId, rejects missing/simultaneous identities, and does not fall back to generic profile.id/profile._id.
- Remaining Mobile profile/direct-room identity entrypoints were audited; no direct-room generic-ID namespace reinterpretation or exact-one violation was found.
- GlobalProfileModal currently has no actual `openProfile` caller, so that path is dormant rather than an active identity source.
- The unsupported `home/profile` and `mypage/profile` ProfileDetail deep-link mappings were removed; internal ProfileDetail screen registration and internal navigation remain intact.
- Home and HotRecommend are the current new-direct-room UI sources and prefer `/discover.targetAccountId` when usable, with explicit `targetUserId` fallback.
- The Mobile direct-room client supports explicit targetAccountId without reinterpreting identity types.
- Chats list counterpart.id remains an ActivityAccount ID and counterpartAccountId is not reinterpreted as a legacy User ID.
- Community Report/Block remains legacy User-level in the DB while Mobile/API accept explicit ActivityAccount targets.
- The server resolves ActivityAccount -> Owner -> legacy User internally without exposing Owner or bridge IDs.
- ChatsScreen counterpartAccountId now supports ChatRoom report/block without exposing a legacy User ID.
- ActivityAccount IDs are never reinterpreted as generic User IDs.
- Follow, Interest, and ProfileVisit remain ActivityAccount-first but are not wired to Mobile profile entrypoints.
- Legacy User default/target ActivityAccount candidate selection now uses a shared primitive in JWT and Chats.
- The shared ordering is isPrimary DESC, createdAt ASC, id ASC.
- Owner primary uniqueness remains unenforced by the DB, although both configured and production audited data are currently clean.
- User.activityAccountBridge remains a legacy compatibility relation, not a primary/current-account relation.
- Shared discover target selection requires an active Owner with exact legacy bridge alignment and uses active candidates ordered by isPrimary DESC, createdAt ASC, id ASC.
- Internal Owner and ActivityAccount bridge fields are not exposed by /discover.

Known gaps:
- no primary uniqueness DB enforcement
- dedicated server-side typing abuse/rate throttling remains future hardening
- attachment/media backend
- unread/read
- push
- Gift sending not financial/server transaction
- no mobile friendship functions
- no Mobile Follow/Interest integration
- LIVE Agora integration
- no commercial Feed/Story
- mojibake in older files

### API
Existing active domains:
auth/users/chats/reports/metrics/announcements/posts/topics/community/
friendships/discover/admin/gifts/store/legal-documents/media/health

Core foundations now present:
- Owner / ActivityAccount
- Wallet / Ledger
- Admin RBAC / Audit / Approval
- New consumer Users are provisioned with an Owner, primary ActivityAccount, and Wallet

The canonical JwtStrategy request context provides User identity plus optional Owner/ActivityAccount context.
JWT does not permanently store ActivityAccount selection state.
The primary / legacy compatibility account is currently resolved server-side.
Future multi-ActivityAccount switching is not implemented yet.
Future account switching should extend the server-side selection layer rather than center on JWT reissuance.
Account-scoped endpoint enforcement remains a separate follow-up task.
Active legacy guards that overwrote req.user were removed from CommunityController and UsersController.
Legacy guard file cleanup/deletion remains a separate follow-up task.

Social identity architecture:
- New Social graph identity is ActivityAccount.
- Existing Friendship / Block / Report compatibility remains User-based.
- Community report/block now accepts explicit ActivityAccount targets and resolves them internally to the existing User-level policy.
- Owner and bridge internal IDs are not exposed by that compatibility boundary.
- Account-scoped Social APIs should use req.user.activityAccountId without storing the selection in JWT.
- A null ActivityAccount context should be rejected only by future account-scoped endpoints; existing User authentication remains valid.
- Block enforcement was not implemented in this schema foundation.
- Follow, Interest, and ProfileVisit enforce bilateral User-level Block visibility and creation policy.
- The Owner/User compatibility boundary must prevent Block bypass across future multi-ActivityAccount identities.

Real Chat identity architecture:
- Existing Chat and Message behavior remains legacy User-based for compatibility.
- Nullable ActivityAccount participant and sender bridges now provide an additive migration path.
- Legacy User identity fields remain required during the transition.
- ActivityAccount deletion preserves Chat/history rows through independent SetNull foreign keys.
- Partial-null Chat bridge state is permitted for transitional history preservation.
- New ActivityAccount direct rooms must set both account participant fields together.
- Canonical account pair ordering and direct-room concurrency safety remain application-layer follow-up work.
- Mobile Chat list, ChatRoom history, and ChatRoom text send HTTP integrations are implemented; text send appends only server-confirmed responses.
- Realtime text delivery, the Mobile typing indicator, and clientMessageId/message-send idempotency are implemented and locally device-validated for the currently validated local 1:1 Chat path; read/unread, attachments, and push remain incomplete.

Major domains still required:
- Gift transactions
- Real Chat
- Feed / Story
- LIVE
- Ads / Rewards
- Redemption / Settlement

### Prisma
Current schema still preserves User as the compatibility center for existing behavior.

New consumer Users now receive Owner / primary ActivityAccount / Wallet provisioning,
while User remains the compatibility center.

Foundation models now include:
- Owner
- ActivityAccount
- Wallet
- WalletLedgerEntry
- AdminApprovalRequest

AuditLog now supports structured reason/context/metadata.

User.pointsBalance remains as a legacy transitional balance field.
Do not remove or repurpose it until dependent APIs are deliberately migrated to Wallet/Ledger.

## Current Phase

Phase 4 design/IA:
COMPLETE ENOUGH TO IMPLEMENT.

Phase 5 core data foundation:
COMPLETE FOR INITIAL FOUNDATION.

Owner / ActivityAccount foundation:
COMPLETE.

Wallet / Ledger foundation:
COMPLETE.

RBAC / Audit / Risk foundation:
COMPLETE.

Mobile navigation foundation:
COMPLETE.

Admin navigation foundation:
COMPLETE.

Friendship / Block safety foundation:
COMPLETE.

Consumer account provisioning foundation:
COMPLETE.

API JWT guard usage unification:
COMPLETE.

ActivityAccount request context foundation:
COMPLETE.

Social identity boundary:
COMPLETE.

ActivityAccount Social graph schema foundation:
COMPLETE.

Follow API/service foundation:
COMPLETE.

Interest API/service foundation:
COMPLETE.

ProfileVisit API/service foundation:
COMPLETE.

SOCIAL foundation:
COMPLETE.

Real Chat existing structure audit:
COMPLETE.

Real Chat DB data audit:
COMPLETE.

ActivityAccount Chat identity schema foundation:
COMPLETE.

ActivityAccount-based direct-room API safety foundation:
COMPLETE.

ActivityAccount-based Chat list identity foundation:
COMPLETE.

ActivityAccount-based message-send identity foundation:
COMPLETE.

ActivityAccount-based message-history foundation:
COMPLETE.

Current ActivityAccount public identity foundation:
COMPLETE.

Mobile real Chat list HTTP integration foundation:
COMPLETE.

Mobile ChatRoom message history HTTP integration foundation:
COMPLETE.

Mobile ChatRoom message send HTTP integration foundation:
COMPLETE.

Mobile direct-room explicit identity boundary:
COMPLETE.

ActivityAccount-compatible Community report/block boundary:
COMPLETE.

ActivityAccount selection invariant audits:
COMPLETE.

Shared deterministic ActivityAccount target selection:
COMPLETE.

Additive Discover target ActivityAccount identity:
COMPLETE.

Mobile Discover target ActivityAccount propagation:
COMPLETE.

Remaining Mobile profile/direct-room identity audit:
COMPLETE.

Unsupported ProfileDetail deep-link cleanup:
COMPLETE.

Mobile Chat history cursor/load-more integration:
COMPLETE.

Real Chat realtime/WebSocket core:
COMPLETE FOR LOCAL 1:1 CORE PATH.

Physical-device 1:1 Chat runtime validation:
COMPLETE.

Phone signup ActivityAccount auth refresh fix:
COMPLETE.

Mobile 1:1 Chat typing indicator:
COMPLETE FOR THE CURRENTLY VALIDATED LOCAL 1:1 CHAT PATH.

Phone signup optional-avatar ActivityAccount state preservation:
COMPLETE FOR THE CURRENTLY VALIDATED LOCAL SIGNUP/CHAT PATH.

Real Chat clientMessageId / message idempotency:
COMPLETE FOR THE CURRENTLY VALIDATED LOCAL 1:1 CHAT PATH.

Fresh OTP login ActivityAccount hydration:
COMPLETE FOR MOBILE AUTH CONTEXT (commit 667946b).

Real Chat read / unread status foundation:
COMPLETE FOR LOCAL 1:1 CHAT PATH (migration 20260923030027_add_message_read_at, API markAsRead, ChatGateway chat:read realtime event, Mobile unread badge & 1-indicator).

Real Chat media attachment backend integration:
COMPLETE FOR LOCAL 1:1 CHAT PATH (POST /media/chat, MediaService.uploadChatMedia, SendMessageDto type field, Mobile uploadChatMedia & ChatRoomScreen media persistence).

Chat push notification foundation (Firebase Cloud Messaging):
COMPLETE FOR LOCAL 1:1 CHAT PATH (Device schema migration 20260923032500_add_device_token_unique_and_index, NotificationsModule/NotificationsService with graceful FCM fallback & auto-cleanup of invalid tokens, ChatsService send push dispatch, and Mobile apiClient token registration).

Next implementation phase:
REAL CHAT & IN-ROOM GIFT TRANSACTIONS — IN PROGRESS.

Chat in-room financial Gift sending transaction foundation (Wallet/Ledger integration):
COMPLETE FOR LOCAL 1:1 CHAT PATH (POST /chats/gift, GiftsService catalog with points, atomic Serializable WalletLedgerEntry debit/credit for sender/recipient, User.pointsBalance synchronization, idempotency, realtime socket broadcast, push dispatch, and Mobile ChatRoomScreen real gift sending & persistence).

Next implementation phase:
MOBILE SOCIAL GRAPH & PROFILE INTEGRATION — IN PROGRESS.

Social Follow & Interest integration on Mobile ProfileDetailScreen (ActivityAccount social graph wiring):
COMPLETE (AppModule FollowsModule/InterestsModule/ProfileVisitsModule global registration, Mobile apiClient followAccount/unfollowAccount/getFollowStatus/sendInterest/removeInterest/getInterestStatus/recordProfileVisit, ProfileDetailScreen auto visit recording, interactive interest toggle with heart icon, and dynamic follow/unfollow toggle with status feedback).

Mobile Friendship / Friends list & bilateral request management integration:
COMPLETE (AppModule FriendshipsModule global registration, SendFriendRequestDto targetAccountId support and legacy User bridge resolution, FriendshipsController GET /friendships/status, Mobile apiClient friendship methods, dedicated FriendsScreen with tabs for accepted friends, incoming requests with accept/decline, and outgoing requests with cancel, RootNavigator registration across Home/Chat/My stacks, SettingsScreen friends counter link, and ProfileDetailScreen interactive friend request status button).

Next implementation phase:
MOBILE COMMUNITY & TOPIC FEED INTEGRATION — IN PROGRESS.

Mobile Community / Topic feed, post list, and interactive creation & comment flow:
COMPLETE (AppModule TopicsModule & PostsModule global registration, TopicsService auto-seeding of standard topics, PostsService author profile enrichment, bilateral block filtering, delete endpoint, Mobile apiClient post/topic methods, dedicated CommunityFeedScreen with topic filtering, write post modal, post reporting/author blocking, and 1:1 chat trigger, RootNavigator registration, and HomeScreen community preview section & DAGAON safety guide).

Next implementation phase:
MOBILE LIVE ROOM FOUNDATION & STREAMING INTEGRATION — IN PROGRESS.

Mobile LIVE Room Foundation / Live room list, streamer creation, and viewer room interface:
COMPLETE (Prisma migration 20260923041804_add_live_room_foundation with LiveRoom and LiveMessage models, LiveModule/LiveService/LiveController endpoints for room lifecycle, viewer counts, and realtime live chat/reactions/gifts, Mobile apiClient live methods, modernized LiveScreen with room cards & broadcast creation modal, interactive LiveRoomScreen with realtime chat, heart reactions, gift sending, and host controls, and RootNavigator LiveStack integration).

Store & In-App Purchase Wallet Flow & Points Store Integration:
COMPLETE (services/api/store_assets/point-products.json canonical point products catalog, StoreService confirmPointPurchase atomic transaction synchronizing pointPurchase, User.pointsBalance, ActivityAccount.Wallet.spendableBalance, and immutable WalletLedgerEntry credit with idempotency, apiClient point products and live endpoints integration, Mobile ShopScreen with live catalog fetch, pull-to-refresh, developer/sandbox instant checkout fallback, and automatic useAuth().refreshMe() point balance synchronization).

Mobile Chat Media Attachments & Profile Avatar Upload Integration:
COMPLETE (AppModule MediaModule registration, MediaController & MediaService multipart file handling, apiClient uploadChatMedia and uploadAvatar methods with dummy auth fallback, ChatRoomScreen image/video attachment flow with real-time uploadingBar progress feedback, and ProfileEditScreen avatar upload integration).

Mobile Push Notification Device Token Registration & Settings Integration:
COMPLETE (NotificationsController & NotificationsService device token registration, apiClient registerDeviceToken/unregisterDeviceToken/getUserDevices, mobile pushNotifications utility with AsyncStorage persistence, AuthContext automatic device token registration on login/startup and cleanup on logout, and SettingsScreen interactive push notification switch toggle with status indicator and Shop navigation link).

Next implementation phase:
COMMUNITY POST COMMENTS & DISCUSSION THREAD FLOW:
COMPLETE (Prisma migration 20260923044851_add_post_comment_foundation with PostComment model, PostsService comment count enrichment, listComments with bilateral block filtering, createComment, and deleteComment with author/post owner authorization, PostsController /posts/:id/comments endpoints, Mobile apiClient getPostComments/createPostComment/deletePostComment methods, and CommunityFeedScreen interactive comments bottom sheet with real-time thread viewing, comment submission, and deletion).

Next implementation phase:
MOBILE USER PROFILE CUSTOMIZATION & SEARCH/FILTER DISCOVERY FLOW:
COMPLETE (DiscoverService extended with q/interest/limit filters and AND-condition region/keyword search, UsersService search enriched with headline/bio/interests/region/ownerBridge, UsersController search response includes targetAccountId, client.js searchUsers() method added, ProfileEditScreen interests multi-select chip UI with direct input + 14 preset tags wired to updateUser interests[], HotRecommendScreen collapsible filter panel with debounced keyword/region/interest-chip API calls to getDiscover(), ProfileDetailScreen interests displayed as pink pill tags, and HomeScreen search button navigates to HotRecommend with filter auto-opened. Backend: feat commit 7185727, Mobile: feat commit f0a56e0).

Next implementation phase:
ADMIN API MANAGEMENT & NOTIFICATION CENTER:
COMPLETE (NotificationsService sendBroadcast with 500-token chunked FCM multicast and invalid token auto-cleanup, NotificationsController POST /notifications/broadcast admin-only endpoint with role/limit query params and GET /notifications/broadcast/history device stats, Admin notifications/page.tsx broadcast center UI with template messages, role targeting, device stats, and send history, Admin api-manager/page.tsx endpoint list with enable/disable toggle, rate-limit editing, module filter, keyword search, and admin layout.tsx Notifications and API Manager nav items. Backend: feat commit f9bea5d, Admin: feat commit d2af8d2).

Next implementation phase:
ADMIN REPORTS & SAFETY — FULL IMPLEMENTATION:
COMPLETE (ReportsService updateStatus with Prisma report.update and blockReportedUser with Block upsert + AuditLog creation + Report RESOLVED auto-mark, AdminReportsController PATCH /admin/reports/:id/status and POST /admin/reports/:id/block-user admin-only endpoints, Admin api.ts getAdminReports/updateAdminReportStatus/blockReportedUser functions, and reports-safety/page.tsx full UI with paginated report list, status filter, keyword search, inline status action buttons REVIEWING/RESOLVED/REJECTED, and block confirmation modal. API build ✅ Admin build 30 pages ✅ Commit 70e399b).

Next implementation phase:
ADMIN SETTLEMENT & REFUND MANAGEMENT — FULL IMPLEMENTATION:
COMPLETE (AdminController GET /admin/settlement/summary, GET /admin/settlement/purchases with platform filter & pagination, GET /admin/settlement/ledger stream, enriched GET /admin/refunds with User relations, PATCH /admin/refunds/:id/approve & deny with audit logging, Admin api.ts settlement and refund functions, and settlement/page.tsx full UI with KPI cards, refund request table with approve/deny actions, point purchase history with platform filtering, and wallet ledger stream. API build ✅ Admin build 30 pages ✅ Commit 32eb3cf).

Next implementation phase:
ADMIN LIVE ROOM MANAGEMENT & MODERATION — FULL IMPLEMENTATION:
COMPLETE (LiveService getAdminSummary with live room / viewer / gift point aggregates, listAdminRooms with status filter & pagination, forceEndRoom with status update & AuditLog creation, LiveController GET /live/admin/summary, GET /live/admin/rooms, POST /live/admin/rooms/:id/force-end, Admin api.ts live management functions, and live/page.tsx full UI with real-time KPI cards, rooms table, chat message log modal, and force-end confirmation modal. API build ✅ Admin build 30 pages ✅ Commit 8bc6281).

Next implementation phase:
ADMIN PERMISSIONS & HIGH-RISK DUAL-CONTROL APPROVAL CENTER — FULL IMPLEMENTATION:
COMPLETE (AdminSecurityController GET /admin/approvals/audit-logs with Actor select, GET /admin/approvals/profiles, PATCH /admin/approvals/profiles/:userId with audit logging, existing 4-eyes dual-control decision & request endpoints, Admin api.ts permissions/approvals/audit-log functions, and admin-permissions/page.tsx full UI with KPI cards, 4-eyes approval list with approve/reject modal and new request dialog, admin profile & permissions matrix editor, and security audit log stream. API build ✅ Admin build 30 pages ✅ Commit 6c47d35).

Next implementation phase:
ADMIN ADS & REWARDS MANAGEMENT — FULL IMPLEMENTATION:
COMPLETE (AdminController GET /admin/ads-rewards/overview with WalletLedger aggregated stats & settings retrieval, PATCH /admin/ads-rewards/policies with AdminIntegrationSetting upserts & audit logging, Admin api.ts ads-rewards functions, and ads-rewards/page.tsx full UI with KPI cards, AdMob & reward policy editor with save action, active campaigns overview, and recent reward ledger stream. API build ✅ Admin build 30 pages ✅ Commit 27bdc23).

Next implementation phase:
MOBILE REWARDED ADS, DAILY ATTENDANCE & REFERRAL REWARD FLOW:
COMPLETE (StoreService getRewardsStatus, claimAttendanceReward, claimAdReward with atomic WalletLedger credit & User.pointsBalance sync, StoreController /store/rewards endpoints, Mobile apiClient getRewardsStatus, claimAttendanceReward, claimAdReward with fallback dummy mode, ShopScreen 무료 포인트 충전소 UI with live attendance check, 5-second simulated rewarded video ad modal, React Native Share referral code sharing, HomeScreen reward banner, Mobile export Android 1461/iOS 1466 modules ✅. API build ✅ Mobile export ✅ Commit 3da3bef).

Next implementation phase:
MOBILE UGC SAFETY, PROFILE & LIVE ROOM MODERATION / REPORT & BLOCK FLOW:
COMPLETE (Reusable ReportModal component with 6 standard UGC violation categories, multiline detail notes, character count, and submitting state; ProfileDetailScreen top-right safety options menu with Report User modal and bilateral Block User confirmation; LiveRoomScreen top-right broadcast/host safety options menu and interactive chat participant tap-to-report/block with instant real-time message stream filtering; apiClient reportUser and blockUser integration. API build ✅ Mobile export Android 1462/iOS 1467 modules ✅ Commit 6041eef).

Next implementation phase:
AGORA VIDEO + AUDIO LIVE STREAMING INTEGRATION (영상+음성 라이브 방송):
COMPLETE (Backend zero-dependency Agora AccessToken006 HMAC-SHA256 builder agora-token.util.ts, deterministic 32-bit positive integer UID mapping, LiveService getAgoraToken and LiveController GET /live/rooms/:id/agora-token endpoint with role/host verification and dev fallback; Mobile apiClient getLiveAgoraToken; LiveRoomScreen real-time Video & Audio streaming UI featuring host camera controls [front/back flip, camera on/off, mic mute/unmute, end broadcast], viewer speaker mute/unmute control, video viewfinder simulation canvas with 1080p stream badge and audio wave visualizer, layered over realtime chat, gifts, hearts, and UGC safety report/block. API build ✅ Mobile export Android 1462/iOS 1467 modules ✅).

Comprehensive Project Health Check, Admin & API Full Verification Pass:
COMPLETE (Admin next build check 30/30 static & dynamic routes compiled PASS ✅, Prisma schema validate PASS ✅, Prisma 18 migrations up-to-date PASS ✅, NestJS API build PASS ✅, Expo mobile export Android 1462 / iOS 1467 modules PASS ✅, git working tree clean PASS ✅).

## Immediate Next Task

App Store & Google Play Store Submission Package & EAS Build Configuration.

Status: READY.

Goals:
- Verify and configure `apps/mobile/eas.json` for production Android AAB (Google Play) and iOS IPA (App Store) builds
- Prepare Store Listing Metadata (App name: 다가온 / DAGAON, Tagline, Description, Keywords, Support URL, Privacy Policy URL)
- Prepare App Store Reviewer Guide (Test credentials for Apple/Google reviewers: phone OTP test account, demo point purchase, live broadcasting guide)
- Prepare Store Screenshot and Banner Assets Specification (Canva design assets)

## RBAC / Audit / Risk Safety Rules

The first RBAC/Audit/Risk foundation must:
- preserve current user authentication and JWT behavior during the transition
- preserve the existing User.role and AdminProfile relationship until migration is deliberate
- enforce authorization server-side, not only in Admin UI
- use explicit permissions and default-deny behavior for protected admin actions
- keep audit records append-oriented and attributable to the acting admin
- capture target, action, reason/context, and relevant metadata for sensitive operations
- create a foundation for high-risk approval and dual-control without implementing every admin workflow at once
- avoid mixing Mobile navigation, Social, Chat, Gift, or LIVE changes into the same feature
- inspect existing admin and audit schema before adding new models or fields
- use its own migration if schema changes are required
- pass Prisma validation/migration checks when applicable
- pass API build and available project checks
- commit separately

## Completed Wallet / Ledger Migration Safety Rules

The first Wallet/Ledger migration must:
- preserve User.pointsBalance during the transition
- introduce a server-authoritative wallet and immutable ledger foundation
- preserve existing point purchase behavior until API migration is deliberate
- backfill current balances without losing or duplicating value
- record transaction provenance and support idempotency
- keep ActivityAccount as the wallet-owning social context
- avoid implementing Gifts, Ads, LIVE, or Redemption in the same migration
- use its own migration
- pass Prisma validation and migration checks
- pass API build and available project checks
- commit separately

## Completed Owner / ActivityAccount Migration Safety Rules

First Owner/ActivityAccount migration must:
- preserve User
- preserve current auth
- preserve AdminProfile relationship
- preserve existing Chat/Friendship/Post behavior
- avoid mass foreign-key rewrites
- create backward-compatible Owner/ActivityAccount foundation
- define a safe backfill path for current users
- be its own migration
- pass Prisma validation
- pass API tests/build
- leave working tree understandable
- commit separately

## Do Not Do Yet

- Do not mass-rename repository/package/database identifiers to DAGAON.
- Do not upgrade Prisma 5.22 to Prisma 8 RC/major version.
- Do not run npm audit fix --force.
- Do not remove legacy modules solely because they look unused.
- Do not rewrite Chat/Wallet/Gift/LIVE simultaneously.
- Do not remove or repurpose legacy User.pointsBalance until dependent APIs are deliberately migrated to Wallet/Ledger.
