# TokFriends

톡친구 만들기(TokFriends) 상용화 작업 저장소입니다.

## 기준 프로젝트 구조

- `services/api` — NestJS + Prisma + PostgreSQL 백엔드 API
- `apps/mobile` — React Native + Expo 모바일 앱
- `apps/admin` — Next.js 관리자 웹
- `legacy/api-admin` — API 저장소에 함께 있던 구 관리자 소스(참고용)
- `infra` — Docker/Nginx/배포 설정
- `docs` — 기존 문서와 복구/상용화 문서
- `contracts` — 기존 API/앱/관리자 계약 및 분석 자료
- `analytics` — 분석 SQL/자료
- `store_assets` — 스토어 등록용 자료

## 보안 원칙

실제 `.env`, 비밀번호/토큰, 서명키, keystore, `node_modules`, 빌드 산출물은 GitHub에 커밋하지 않습니다. 각 프로젝트의 `.env.example`을 기준으로 개발 PC와 배포 환경에서 별도로 `.env`를 만듭니다.

## 현재 복구 방향

1. 로컬 개발환경과 Git 기준점 구성
2. Prisma 마이그레이션 기준선 재구성
3. API 실행 및 PostgreSQL 연결 검증
4. 관리자 웹 API 연결 및 인증 정리
5. Expo/React/React Native 버전 정합성 복구 및 Android target SDK 대응
6. 실시간 채팅, OTP/SMS, Push, 신고/차단, 상점/포인트 기능 완성
7. 보안 점검, 테스트, 운영 배포, 스토어 출시
