# DAGAON Development Checkpoint

Updated: 2026-09-16

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
84584038832687e452656a4df542740647dced9e
fix: remove unsupported profile deep links

Remote GitHub branch HEAD verified:
84584038832687e452656a4df542740647dced9e

Parent commit:
2612bd56dfbdb8942423939e51d4786472e12dd4

GitHub compare verified exactly one commit ahead with exactly one changed file,
0 additions, 2 deletions, and no other files.

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

2026-09-15:
npx prisma migrate status
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

### Production deployment limitation

- Render production tokfriends-db has the latest tracked migrations applied and its ActivityAccount invariants were verified as CLEAN FOUNDATION.
- Render tok-friends-api currently deploys branch chore/api-recovery.
- The shared deterministic selector, additive `/discover targetAccountId`, ActivityAccount Chat list/direct-room/history/send code, Community report/block ActivityAccount compatibility, and the GET `/users/me activityAccountId` contract on this working branch are not yet live on the Render production API.
- Mobile targetAccountId propagation and the ProfileDetail deep-link cleanup are working-branch Mobile code; this checkpoint does not claim they are present in a released production app.
- Mobile fallback behavior remains compatible with a production API that does not yet return `targetAccountId`, but production-endpoint E2E verification remains limited until the API deployment branch changes.

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
- Chat history cursor/load-more
- realtime/WebSocket
- attachment/media backend
- unread/read
- push
- clientMessageId/idempotency
- Gift sending not financial/server transaction
- no mobile friendship functions
- no Mobile Follow/Interest integration
- no LIVE
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
- Realtime, read/unread, attachments, push, history load-more, and clientMessageId/idempotency remain unimplemented.

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

Next implementation phase:
REAL CHAT — IN PROGRESS.

## Immediate Next Task

Mobile Chat history cursor/load-more integration.

Keep this as one small Mobile-only slice.

Target:
- apps/mobile/src/api/client.js
- apps/mobile/src/screens/main/ChatRoomScreen.js

Goals:
- preserve the existing initial history load and backend oldest-to-newest display contract
- allow the Mobile client to request older history using the backend `nextCursor`
- keep cursor identity opaque; do not parse or reinterpret it client-side
- prepend older server-confirmed messages without duplicating message IDs or reordering the current page
- stop requesting when `nextCursor` is null/empty
- keep stale-request protection and existing current ActivityAccount sender classification intact
- preserve current text-send behavior and do not mix pagination with realtime, unread/read, attachments, push, gift transactions, or idempotency work

Before implementation, re-read the backend GET `/chats/:chatId/messages` cursor contract and the current Mobile `getChatMessages` / ChatRoom history state to confirm the minimal request shape.

Out of scope: WebSocket/realtime, unread/read, attachment/media backend, push, `clientMessageId`/idempotency, Gift transactions, Social wiring, LIVE, Prisma/schema/migrations, production deployment changes, and dependency upgrades.

First commands to run when resuming:

cd C:\Users\ION\Downloads\work\tokfriends
git branch --show-current
git status --short
git log -1 --oneline

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
- pass Prisma validation and migration checks when applicable
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
