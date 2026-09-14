# DAGAON Project Context

Updated: 2026-09-14

## 1. Project Goal

DAGAON(다가온)은 사람 발견, 소셜 관계, 1:1 채팅, Feed/Story, LIVE, Gift, Points, Creator 수익, 출금/정산까지 포함하는 상용 소셜 플랫폼이다.

공식 브랜드:
- 한글명: 다가온
- 영문명: DAGAON
- 슬로건:
  - 새로운 사람이 다가오고,
  - 새로운 이야기가 시작된다.

사용자에게 노출되는 기존 명칭(MJ톡, 톡친구, Tok Friends)은 단계적으로 DAGAON으로 변경한다.
repo/package/database/app package id 같은 기술 식별자는 안전성 검토 없이 일괄 변경하지 않는다.

## 2. Working Style

사용자는 비개발자이므로 실제 구현은 한 번에 하나의 작은 단계로 진행한다.

원칙:
- 한국어로 설명한다.
- PowerShell 명령은 그대로 복사/실행할 수 있게 제공한다.
- 수정 전 현재 파일/상태를 확인한다.
- 이미 확정된 정책을 반복해서 묻지 않는다.
- 정상 출력이면 짧게 확인하고 다음 단계로 진행한다.
- 확인이 필요하면 "결과 보여주세요."로 끝낸다.
- 대규모 일괄 수정 대신 작은 migration / test / commit 단위로 진행한다.
- 비밀정보/.env는 Git에 커밋하지 않는다.
- npm audit fix, --force 같은 위험한 자동 수정은 사용하지 않는다.

Git 검증 기본 흐름:
1. git status
2. 필요한 파일만 수정
3. 테스트/빌드
4. git diff --check
5. diff 검토
6. 예상 파일만 stage
7. cached diff 검토
8. commit
9. push
10. local/origin/remote SHA 확인

## 3. Repository / Environment

GitHub:
https://github.com/sonjunho2/tokfriends.git

Local path:
C:\Users\ION\Downloads\work\tokfriends

Main components:
- API: services/api
- Mobile: apps/mobile
- Admin: apps/admin

Stack:
- API: NestJS 10 + Prisma 5.22 + PostgreSQL
- Mobile: React Native / Expo SDK 57
- Admin: Next.js 14
- LIVE target: LiveKit Cloud

Production references:
- API: https://tok-friends-api.onrender.com
- Admin: https://tokfriends-admin.vercel.app

## 4. Mobile Runtime Baseline

Expo SDK 57 runtime verification is complete.

Verified:
- Expo 57.0.22
- React Native 0.86.3
- React 19.2.3
- babel-preset-expo added
- expo-doctor: 21/21 PASS
- Android build: PASS
- Android emulator runtime: PASS
- MyPage -> BlockedUsers -> back runtime: PASS
- android/local.properties is local/ignored
- package: com.sonjunho.ddakchin

Last verified SDK57 dependency commit:
6992879bb3067dc331e3aeeeada65086eba19930
fix: align Expo SDK 57 runtime dependencies

Known non-fatal issue:
- React Navigation deprecated object-form navigate warning; later cleanup required.

npm audit previously reported 27 vulnerabilities (21 moderate, 6 high).
Do not run npm audit fix or --force blindly.

## 5. Current Prisma / Database Baseline

Prisma migrations:
- 20260901000000_initial_baseline
- 20260903011612_allow_admin_null_profile_fields
- 20260903013009_add_admin_profile
- 20260903025431_add_admin_settings_storage
- 20260908014500_add_user_token_version
- 20260908044000_add_legal_documents

On 2026-09-14 local PostgreSQL was checked with:
npx prisma migrate status

Result:
Database schema is up to date!

The last two migrations were applied locally using:
npx prisma migrate deploy

No tracked source changes resulted from migration deployment.

Prisma 5.22 is currently used.
Do not upgrade to Prisma 8 RC/major version during unrelated feature work.

## 6. Current Prisma Models

Current schema includes:
- User
- Profile
- PhoneVerification
- PointPurchase
- Photo
- Friendship
- Chat
- Message
- Topic
- Post
- Report
- Block
- Device
- Subscription
- AnalyticsEvent
- AuditLog
- RefundRequest
- Announcement
- BannedWord
- AdminProfile
- AdminFeatureFlag
- AdminIntegrationSetting
- AdminSettingsState
- LegalDocument
- LegalDocumentVersion

Enums:
- AdminTeamRole
- AdminTeamStatus
- ReportStatus

Current structural limitation:
- User currently combines login identity, public activity identity, and points balance.
- User.pointsBalance is direct balance storage.
- No Owner / ActivityAccount / Wallet / Ledger foundation yet.

## 7. Current Mobile Structure

Current main bottom tabs:
- Home
- Chats
- Shop
- MyPage

Final DAGAON bottom tabs:
- Home
- Live
- Chat
- Points
- My

Current major screens:
- auth/AgreementScreen.js
- auth/PhoneEntryScreen.js
- auth/PhoneVerificationScreen.js
- auth/ProfileRegistrationScreen.js
- auth/WelcomeScreen.js
- main/HomeScreen.js
- main/ChatsScreen.js
- main/ChatRoomScreen.js
- main/ProfileDetailScreen.js
- my/BlockedUsersScreen.js
- my/ProfileEditScreen.js
- my/SettingsScreen.js
- recommend/HotRecommendScreen.js
- shop/ShopScreen.js

Existing reusable behavior:
- Home getDiscover() integration
- ProfileDetail -> ensureDirectRoom() -> ChatRoom
- ChatRoom photo/video picker
- ChatRoom Gift options UI
- ChatRoom report/block API calls
- Shop point products API
- Shop IAP flow + confirmPurchase()
- Settings/My profile/settings skeleton

Current gaps:
- ChatsScreen uses local dummy list.
- ChatRoom uses INITIAL_MESSAGES/local appendMessage for messages.
- Gift sending is UI/local only; no real wallet transaction.
- Follow and Interest APIs are absent.
- Friendships exist server-side but are not connected in mobile client.
- LIVE does not yet exist.
- Feed/Story commercial implementation does not yet exist.
- Many older mobile strings/comments contain mojibake and require cleanup during screen rewrite.

## 8. Current API Modules / Routes

Active root API modules include:
- health
- auth
- users
- chats
- reports
- metrics
- announcements
- posts
- topics
- community
- friendships
- discover
- admin
- gifts
- store
- legal-documents
- media

There is a duplicate/legacy-looking services/api/src/modules/app.module.ts.
Actual bootstrap is services/api/src/app.module.ts from main.ts.
Do not delete legacy/unused modules without separate verification.

Important current functionality:
- Auth signup/login/phone flows
- User profile/search
- Discover
- Friendships
- 1:1 chat room creation
- Community report/block
- Gift options GET
- Store point products + purchase confirmation
- Admin user/settings/refund/report functionality
- Legal documents

Major missing commercial domains:
- Owner / ActivityAccount
- Wallet / Ledger
- real Gift transaction
- Follow / Interest / Visitors
- Feed/Story full model
- LIVE
- Ads / Rewards
- Redemption / Settlement
- Places / Reviews / Business / Reservation

## 9. Current Admin Structure

Existing routes include:
- /dashboard
- /users
- /users/[id]
- /users/phone-verification
- /chats
- /content
- /matches
- /store
- /store/point-products
- /analytics
- /settings
- /settings/legal
- /login

Final DAGAON Admin IA:
- Dashboard
- Members
- Social
- Chat
- Live
- Content
- Points & Gifts
- Ads & Rewards
- Settlement
- Reports & Safety
- Analytics
- Admin & Permissions
- Settings

Existing admin screens should be reused and reorganized rather than discarded.

## 10. Final Mobile IA

MainTabs:
- Home
- Live
- Chat
- Points
- My

Home:
- Story
- 오늘의 다가온 / Discover
- LIVE NOW
- Feed: 추천 / 팔로잉
- FeedCreate
- Search
- Notifications

Live:
- 추천 / 팔로잉 / 인기 / 신규 / 카테고리
- LiveRoom
- ScheduledLives
- LiveRanking
- CreateLive
- CreatorLiveConsole
- LiveResult

Chat:
- 전체 / 안읽음 / 즐겨찾기 / 보관
- NewChat
- ChatRoom
- text/photo/video/Gift/reply/reaction/read/typing/edit/delete

Points:
- WalletSummary
- PointCharge
- PointEarn
- Attendance
- RewardAds
- Referral
- Coupon
- GiftHistory
- PointHistory
- Redemption
- TransactionDetail

My:
- MyProfile
- ActivityAccounts
- Visitors
- Friends
- Followers
- Following
- Interests
- Favorites
- SavedPosts
- BlockedUsers
- CreatorDashboard
- Notification/Privacy/Security/Appearance settings
- Help/Inquiry/Appeals
- IdentityVerification
- Legal
- AccountManagement

## 11. Product Policies Already Decided

Identity:
- One Owner can have multiple ActivityAccounts.
- Authentication credentials belong to Owner.
- ActivityAccount linkage under one Owner is never public.
- Current activity account controls active social/chat/wallet context.
- Unique @ID; display nicknames may duplicate.
- Contact matching is opt-in; do not auto-friend or auto-follow.

Social:
- Follow is unilateral.
- Friend is mutual.
- Interest is private.
- Non-friends may chat subject to safety/privacy rules.
- Profile visits: recent 7 days, opt-out, deduplicated.
- Strong block behavior: mutual invisibility across relevant surfaces.

Chat:
- 1:1 first.
- Text/photo/video/Gift.
- Read + typing.
- Edit within 15 minutes.
- Delete-for-everyone window is admin-configurable.
- One-view media supported.
- Reply/reaction/report/block.
- No voice/files/location initially.
- idempotency/retry required.

Points:
- Sources: IAP, ads, attendance, referral, event, coupon, admin adjustment, bonus.
- Wallet/Ledger is server-authoritative.
- No direct P2P point transfer except Gift/admin adjustment.
- Separate activity-account wallets.
- Financial source/provenance must be traceable.

Gift:
- Static / animated / fullscreen catalog.
- Fee snapshot by transaction context.
- Real Gift transaction must use Wallet/Ledger.
- Local UI confirmation alone must never be considered a completed Gift.

LIVE:
- LiveKit Cloud for real-time media.
- DAGAON API is business authority.
- Initial commercial launch is adult-only.
- Initial: 1-person LIVE, real-time chat, follow, Gift, Super Chat, paid room, report/block/kick, schedule, basic stats.
- Later: guest, multi-guest, PK, replay, PIP, background audio, membership, sponsorship.

Feed:
- Text/photos/video up to 60 seconds initially.
- Like/comment/Gift/share/repost/save/report.
- Story expires after 24 hours.
- Story replies go to chat.

Redemption:
- Cash + voucher/coupon routes.
- Stronger identity verification.
- Cash minimum is admin-configurable; initial planning baseline around KRW 30,000.
- Risk review / hold / reconciliation required.

## 12. Security / Operations Policies Already Decided

- Strong Admin RBAC
- 2FA
- audit logging
- high-risk approvals
- four-eyes review where required
- incident mode
- per-function kill switch
- typed feature flags / remote config
- controlled A/B testing
- canary rollout
- build once promote
- production change IDs / risk levels / rollback
- CI/CD required checks
- observability: metrics/logs/traces/business events/audit
- runbooks / on-call / postmortem
- provider circuit breakers / retries / idempotency / reconciliation
- data retention / deletion orchestration / backup / legal hold
- Privacy Center / DSAR
- vendor/privacy/data-map controls
- data classification and sensitive-data protection

Auth baseline:
- access JWT around 15m
- opaque hashed rotating refresh token
- inactive ~30d / absolute ~90d session policy
- secure mobile storage
- admin BFF cookies
- OAuth PKCE
- OTP: 6 digits, ~3m, max attempts, resend limits, dynamic abuse limits
- no universal OTP codes in production logs
- passkeys/TOTP/recovery codes planned
- password baseline min 15 chars, block leaked/common passwords
- no arbitrary composition requirement or periodic forced rotation
- credential stuffing / anti-bot protections

## 13. Design Direction

DAGAON is a premium social platform, not a heart-heavy dating-app visual.

Core colors planned:
- Primary #6D4AFF
- Primary Light #F0ECFF
- Primary Dark #5536E8
- Live #FF3B6B
- Info #3B82F6
- Success #22A06B
- Warning #F5A524
- Danger #E5484D
- Premium Gold #D6B36A
- Dark background #0B0D12

Support Light + Dark.

Main design components:
- AppBar
- BottomNav
- Avatar
- UserCard
- FeedCard
- LiveCard
- ChatRow / MessageBubble
- GiftCard
- WalletCard
- TransactionRow
- BottomSheet
- Modal
- Toast
- Skeleton
- Empty / Error states

## 14. Target Backend Domain Boundaries

Planned modules:
- auth
- owners
- activity-accounts
- profiles
- discover
- social
- friendships
- follows
- interests
- visitors
- blocks
- chats
- messages
- gifts
- wallets
- ledger
- purchases
- rewards
- ads
- referrals
- attendance
- feed
- stories
- media
- live
- creators
- redemptions
- settlements
- reports
- moderation
- notifications
- legal-documents
- analytics
- admin
- health

Do not mass-refactor all modules at once.

## 15. Target Core Data Model

Current User model must not be deleted immediately.

Migration direction:

Existing User
-> create Owner
-> create primary ActivityAccount
-> migrate/attach Profile
-> migrate Social/Chat ownership to ActivityAccount
-> introduce Wallet/Ledger
-> verify all consumers
-> only then retire legacy User responsibilities/fields

Core new concepts:
- Owner
- ActivityAccount
- ActivityProfile
- Wallet
- LedgerTransaction
- LedgerEntry
- GiftCatalog
- GiftTransaction
- Follow
- Interest
- ProfileVisit
- ChatMember
- MessageReaction
- MessageRead
- FeedPost / FeedMedia / FeedLike / Comment / SavedPost
- Story / StoryView / StoryReaction
- LiveRoom / LiveParticipant / LiveChatMessage / LiveAdmission / LiveGift / SuperChat
- RewardGrant
- RedemptionRequest
- Settlement / SettlementBatch
- Notification
- ModerationCase / ModerationAction / Appeal / RiskSignal
- AdminPermission / AdminApproval

Ledger should be designed so economic flows are traceable and balancing entries can be reconciled.

## 16. Implementation Order

1. Owner / ActivityAccount
2. Wallet / Ledger
3. RBAC / Audit / Risk foundations
4. Mobile navigation restructuring
5. Admin navigation restructuring
6. Social
7. Real Chat
8. Gift
9. Points / Rewards / Ads
10. Feed / Story
11. LIVE
12. Redemption / Settlement
13. Places / Business
14. advanced Creator features
15. security/performance/load/store/legal/compliance validation

For each feature group:
schema -> migration -> backfill -> API -> tests -> runtime verification -> Git commit/push -> next feature.

## 17. Current Next Development Task

Design/IA phase is considered complete enough to begin implementation.

Next implementation:
Owner / ActivityAccount foundation.

Before editing:
- verify branch
- verify working tree
- verify latest commit

Then:
- inspect exact current Prisma schema
- add new models in a backward-compatible way
- do not delete User
- generate a dedicated migration
- backfill existing users safely
- validate Prisma + API build/tests
- inspect diff
- commit/push only expected files
