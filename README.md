# TokFriends

톡친구 만들기(TokFriends) 상용화 작업 저장소입니다.

## Active projects

- `services/api` — NestJS + Prisma + PostgreSQL backend API
- `apps/mobile` — React Native + Expo mobile app
- `apps/admin` — Next.js admin web

## Supporting folders

- `infra` — Docker/Nginx/Render reference deployment configuration
- `analytics` — analytics queries/reference
- `contracts` — API/app/admin contract snapshots and reports
- `docs` — existing project/deployment/store-review documentation
- `store_assets` — app-store listing assets
- `legacy/api-admin` — old admin app embedded in the API repository; reference only

## Security

Real `.env` files, signing keys, keystores, build outputs, and dependency folders are intentionally not committed. Start from each project's `.env.example` and create local `.env` files only on development machines or deployment platforms.

## Current recovery direction

1. Establish a clean local development baseline.
2. Rebuild the Prisma migration baseline before applying migrations to a fresh database.
3. Normalize Expo/React/React Native versions and Android target SDK.
4. Remove development authentication bypasses and hard-coded fallback credentials before production.
5. Connect and verify API, admin, mobile, real-time chat, OTP/SMS, push, store/payment, moderation, and deployment in phases.
