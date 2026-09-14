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

Last verified dependency/runtime commit:
6992879bb3067dc331e3aeeeada65086eba19930
fix: align Expo SDK 57 runtime dependencies

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

2026-09-14:
npx prisma migrate deploy
applied the final two pending migrations.

Then:
npx prisma migrate status
=> Database schema is up to date!

git status --short afterward:
clean.

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
STARTING.

## Immediate Next Task

Implement Owner / ActivityAccount foundation safely.

First command to run when resuming:

cd C:\Users\ION\Downloads\work\tokfriends
git branch --show-current
git status --short
git log -1 --oneline

Then inspect exact Prisma schema before edits.

## First Migration Safety Rules

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
