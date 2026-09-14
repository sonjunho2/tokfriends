# DAGAON Development Checkpoint

Updated: 2026-09-14

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
92133fbe258caa4a69bbadcc83f46a0d52712ae9
feat: add wallet ledger foundation

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

2026-09-14:
npx prisma migrate deploy
applied the final two pending migrations.

Then:
npx prisma migrate status
=> Database schema is up to date!

git status --short afterward:
clean.

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

Major new domains required:
Owner/ActivityAccount
Wallet/Ledger
Gift transactions
Follow/Interest/Visitors
Feed/Story
LIVE
Ads/Rewards
Redemption/Settlement

### Prisma
Current schema still centers most behavior on User.
User.pointsBalance is a direct integer balance.

Do not delete or radically repurpose User in first migration.

## Current Phase

Phase 4 design/IA:
COMPLETE ENOUGH TO IMPLEMENT.

Phase 5 core data foundation:
IN PROGRESS.

Owner / ActivityAccount foundation:
COMPLETE.

Wallet / Ledger foundation:
COMPLETE.

RBAC / Audit / Risk foundation:
NEXT.

## Immediate Next Task

Implement RBAC / Audit / Risk foundation safely.

First commands to run when resuming:

cd C:\Users\ION\Downloads\work\tokfriends
git branch --show-current
git status --short
git log -1 --oneline

Then inspect the exact current AdminProfile, AuditLog, admin authorization, JWT guard, and high-risk admin action paths before editing.

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
- Do not change User.pointsBalance until Wallet/Ledger migration plan is implemented.
