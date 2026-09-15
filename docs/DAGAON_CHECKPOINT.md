# DAGAON Development Checkpoint

Updated: 2026-09-15

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
b2ce5bc982dfe56d5825971e3229eda14e59f3de
feat: add DAGAON admin navigation foundation

Remote GitHub branch HEAD verified:
b2ce5bc982dfe56d5825971e3229eda14e59f3de

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

2026-09-14:
npx prisma migrate status
=> Database schema is up to date!

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
Home / Chats / Shop / MyPage

Reusable:
- Home discover API
- ProfileDetail direct-room creation
- Chat image/video picker
- Chat gift options UI
- report/block
- Point product/IAP purchase flow
- current Settings/My shell

Known gaps:
- Chats list dummy data
- ChatRoom local INITIAL_MESSAGES
- Gift sending not financial/server transaction
- no mobile friendship functions
- no Follow/Interest
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

Major domains still required:
- Gift transactions
- Follow / Interest / Visitors
- Feed / Story
- LIVE
- Ads / Rewards
- Redemption / Settlement

### Prisma
Current schema still preserves User as the compatibility center for existing behavior.

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

Next implementation phase:
SOCIAL.

## Immediate Next Task

Begin the DAGAON Social foundation safely.

First commands to run when resuming:

cd C:\Users\ION\Downloads\work\tokfriends
git branch --show-current
git status --short
git log -1 --oneline

Before editing, inspect the exact existing Prisma social models and current API/mobile usage for:
- Friendship
- discover
- block/report
- profile relationships
- existing /matches Admin route
- current social client methods

Define the first backward-compatible Social implementation slice from the existing code before changing schema or APIs.

Do not mix Real Chat, Gift, LIVE, Feed/Story, or Points/Rewards implementation into the first Social commit.

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
