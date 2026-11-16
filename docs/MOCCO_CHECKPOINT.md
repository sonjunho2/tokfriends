# 모꼬 (MOCCO) 프로젝트 종합 체크포인트 (Checkpoint)

> **문서 버전**: v2.0.0 (모꼬 전면 개편 최신판)  
> **최종 갱신 일시**: 2026-11-16  
> **기준 브랜치**: `main` (최신 커밋 `03934ce` 반영 완료)

---

## 1. 프로젝트 주요 현황 요약

| 영역 | 기술 스택 | 배포 위치 / 식별자 | 상태 |
|---|---|---|---|
| **모바일 앱** | React Native (Expo SDK 52) / TypeScript / Android Native | `com.sonjunho.ddakchin`<br/>`build_output/mocco-release.apk` | ✅ 정상 가동 중 (에뮬레이터 및 실기기 검증 완료) |
| **웹 포털 / 관리자** | Next.js 14 (App Router) / TailwindCSS / Radix UI | `https://tokfriends.vercel.app` | ✅ 정상 가동 중 (Vercel 자동 배포 연동) |
| **백엔드 REST API** | NestJS / Prisma ORM / PostgreSQL | `https://tok-friends-api.onrender.com/v1` | ✅ 정상 가동 중 (Render Hosted) |
| **실시간 웹소켓** | Socket.io (NestJS WebSocketGateway) | `wss://tok-friends-api.onrender.com` | ✅ 정상 가동 중 (실시간 채팅/선물/수다 중계) |

---

## 2. 최근 해결된 핵심 문제 및 검증 체크포인트

### ✅ 1. 전체수다방 삭제 시 흰 화면(White Screen) 크래시 해결
- **문제 원인**: `apps/mobile/src/screens/main/ChatsScreen.js` 상단 `react-native` import에서 `Alert`가 누락되어 삭제 버튼 탭 시 `[ReferenceError: Property 'Alert' doesn't exist]` 발생 후 앱 크래시.
- **조치 내용**:
  - `Alert` 모듈 정상 import 추가.
  - 삭제 시 네이티브 다이얼로그(`Alert.alert`)가 즉시 팝업되고, 확인 클릭 시 에러 없이 부드럽게 삭제 처리.
- **검증 결과**: 안드로이드 에뮬레이터(`emulator-5554`)에서 `뭐를테스트해 제ㅏㅂㄹ` 및 `테스트합시다` 방을 삭제 테스트하여 크래시 없이 즉시 제거됨을 스크린샷으로 100% 실증.

### ✅ 2. 수다방 삭제 후 새로고침 시 다시 나타나는 버그 해결
- **문제 원인**:
  1. 모바일 앱 `sudaService.ts`의 `fetchSudaPosts`에서 서버로부터 매핑된 목록을 순회할 때 `if (deletedSudaIds.has(p.id)) continue;` 검사가 누락되어 캐시/서버 데이터가 다시 추가됨.
  2. 웹 프론트엔드에서 삭제 요청 시 프록시 라우트 origin 검증으로 인해 백엔드 REST API 실제 삭제가 지연/누락되는 문제.
- **조치 내용**:
  - `sudaService.ts`에 삭제 ID 필터 가드 완벽 추가.
  - `apps/admin/src/lib/api.ts`의 `deleteSudaPost`에 프록시 실패 시 백엔드 직접 호출(Direct Fallback) 추가.
  - 백엔드 DB 상의 잔여 포스트 영구 삭제 완료.
- **검증 결과**: 화면을 아래로 당겨 새로고침(Pull-to-refresh)을 하거나 다른 탭으로 이동했다 돌아와도 삭제된 방이 복구되지 않고 삭제 상태가 완벽히 유지됨.

### ✅ 3. 웹과 앱의 전체수다 방 목록 불일치 해결
- **문제 원인**: 웹 화면에서는 과거 브라우저 로컬스토리지에 삭제된 방이 숨김 처리되어 있었으나, 백엔드 DB에는 남아 있어 새로 설치된 앱에서 해당 방(`나랑대화해`)이 노출되는 차이 발생.
- **조치 내용**:
  - 백엔드 DB의 잔여 포스트 완전 삭제.
  - 웹 `apps/admin/src/app/page.tsx`에 `chatSubTab === 'SUDA'` 활성화 감지 Effect를 추가하여 탭 진입 시 항상 백엔드 최신 목록과 실시간 동기화.
- **검증 결과**: 현재 웹과 앱 모두 1위 `수아`, 2위 `도현`, 3위 `유진`, 4위 `지우`, 5위 `이지수`로 100% 동일하게 일치.

### ✅ 4. 1:1 대화방 선물 전송 시 발신자가 '슈퍼어드민'으로 나오고 슈퍼어드민 꿀떡만 소모되던 문제 해결
- **문제 원인**:
  1. 웹에 `sendChatGift` API가 없어 일반 메시지 API(`POST /chats/message`)로 단순 텍스트만 전송하였음.
  2. 백엔드 `ChatController`에서 어드민 세션 쿠키(`tokfriends_admin_session`)가 존재할 경우, 클라이언트가 전달한 실제 회원 ID(`body.senderAccountId`)보다 어드민 계정(`Super Admin`)을 우선하여 채택함.
  3. 실시간 소켓 게이트웨이에서도 어드민 ID로 발신자가 덮어써져 상대방에게 'Super Admin'으로 표시됨.
- **조치 내용**:
  - `apps/admin/src/lib/api.ts`에 정식 `sendChatGift` 구현 (프록시 + 직접 백엔드 Fallback).
  - 웹 `handleSendGift`에서 `sendChatGift`를 호출하여 백엔드 DB에서 **실제 로그인 회원(테스터02 등)의 꿀떡을 차감**하고 **상대방 회원에게 꿀떡을 적립**하도록 연동.
  - 백엔드 `ChatController` 및 `ChatGateway`에서 어드민 쿠키가 있더라도 **실제 요청 본문의 `senderAccountId`와 `senderNickname`을 최우선으로 존중**하도록 로직 전면 수정.
  - 모바일 앱 `client.sendChatGift`에도 `senderNickname` 매개변수 연동.
- **검증 결과**: 이제 대화방에서 선물을 보내면 실제 본인 계정의 닉네임으로 선물이 기록되고, 본인의 꿀떡 잔액이 정상 소모되며 상대방에게 적립됨.

### ✅ 5. 1:1 대화방 상대방 닉네임 표기 및 읽지 않음 뱃지 동기화
- **조치 내용**:
  - `ChatsScreen.js` 및 `sudaService.ts`에서 대화방 목록 조회 시 본인 닉네임('나')이나 'Super Admin'으로 잘못 표기되지 않도록 상대방(`counterpart`) 정보 정밀 매핑.
  - 카카오톡 스타일 '1' 읽음 표시: 대화방에 입장해 있거나 답장을 보낸 경우 이전 상대방 메시지의 `readAt`을 소급 갱신하여 1이 즉시 사라지도록 소켓 이벤트(`chat:read`) 전파.

---

## 3. 기능별 세부 구현 현황

### 3.1 모꼬 LIVE (실시간 동네 스트리밍)
- [x] Agora RTC SDK 연동 (호스트 카메라 방송 송출 & 시청자 실시간 수신)
- [x] 시청자 입장 시 "OOO님이 입장했습니다" 환영 메시지 자동 송출
- [x] 방송 종료 시 "라이브가 종료되었습니다" 오버레이 안내 표출
- [x] 3단계 3D 선물 이펙트 연동 (볼빨간 모꼬, 구름카 질주, 골든 킹 축제)
- [x] 스트리머 후원 포인트 실시간 적립 및 VIP 랭킹 시트 연동

### 3.2 모꼬챗 (실시간 1줄 수다 & 1:1 대화)
- [x] 전체수다: 1줄 방 만들기 (제목, 입장료 설정)
- [x] 전체수다: 방 개설자 본인만 `🗑️ 삭제` 버튼 노출 (타인은 `입장하기`)
- [x] 전체수다: 삭제 시 확인 Alert 팝업 및 DB/앱/웹 실시간 영구 삭제 동기화
- [x] 1:1 대화방: 상대방 닉네임/프로필 정확한 표출
- [x] 1:1 대화방: 미열람 메시지 카운트(뱃지) 및 읽음(1 사라짐) 처리
- [x] 1:1 대화방: 빠른 첨부 (카메라, 앨범, 선물하기 바텀시트)
- [x] 1:1 대화방: 상대방 신고하기(관리자 백오피스 접수) 및 차단하기(마이모꼬 차단목록 연동)
- [x] 1:1 대화방: 3D 선물 보내기 (본인 꿀떡 차감, 상대방 적립, 이펙트 재생)

### 3.3 모꼬마켓 (안전 에스크로 중고거래 & 직영 커머스)
- [x] 동네 중고거래(C2C) 게시글 등록, 수정, 삭제
- [x] 거래 전용 '거래 톡' 자동 생성 및 에스크로 결제 상태 카드 연동
- [x] 본사 직영(B2C) 신선식품 및 추천 상품 목록 연동
- [x] 구매확정, 반품/환불, 분쟁 중재 프로세스

### 3.4 마이모꼬 & 설정
- [x] 모꼬 꿀떡 지갑 잔액 조회 및 무료 충전소 / 상점 연동
- [x] 프로필 정보(닉네임, 지역, 매너온도, 프로필 사진) 관리
- [x] 차단 회원 목록 조회 및 차단 해제 기능
- [x] 알림 설정 및 회원 탈퇴(계정 및 개인정보 영구 파기) 기능

---

## 4. 빌드 및 배포 산출물 현황

- **최신 Git 커밋**: `03934ce` (`fix(chat,gift): send gifts with real sender account instead of Super Admin, deduct/credit points for actual users`)
- **Android Release APK**:
  - `build_output/mocco-release.apk` (104.8 MB)
  - `build_output/MOCCO_LiveTest_v1.2.0.apk` (104.8 MB)
- **에뮬레이터 설치 상태**: `emulator-5554`에 최신 빌드 설치 및 전체수다 화면 정상 동작 중
- **웹 스토어프론트**: `https://tokfriends.vercel.app` (Vercel 최신 배포 연동)

