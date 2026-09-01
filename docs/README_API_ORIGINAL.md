# Tok Friends — Fullstack **Pro** (Flutter + NestJS + Next.js Admin)
Generated: 2025-08-18T04:37:10.830159Z

This is the **enhanced** version including:
- Apple ID token verification (JWKS) & JWT Guard
- Friend Requests API (send/accept/decline/cancel/block)
- Discover API with ranking & filters
- Content Safety: bad-word filter (ko/en) + AWS Rekognition hook
- Push notifications (FCM, APNs stub)
- IAP Receipt verify (iOS/Android) — test-friendly stubs
- Analytics events table + logger
- Admin pages for Reports & Users


## Ultra Additions (Generated 2025-08-18T04:41:24.351814Z)
- Rate limiting (Redis or in-memory fallback)
- WebSocket chat gateway (real-time events)
- Icebreaker auto-generation (interest-based templates)
- Translation service interface (Papago/Google/AWS pluggable; test mode returns source text)
- RBAC admin endpoints + AuditLog table
- Refund Request flow + Admin UI
- Dockerfiles & GitHub Actions for API/Admin
- Production docker-compose + Nginx reverse proxy template
- Store Review Package (demo accounts, privacy policy template, data safety notes)


## Max Additions (Generated 2025-08-18T04:44:51.234808Z)
- **Socket.IO 인증 채팅**: 토큰 인증(handshake), 룸 조인(chat:ID), 타이핑 이벤트, 서버 저장 & 브로드캐스트
- **실번역 프로바이더**: Papago(네이버), Google(v2 API Key), AWS Translate 선택적 연동 — 키가 없으면 테스트 모드
- **KPI 대시보드**: Postgres 뷰/머티리얼라이즈드 뷰 + Metabase 연결 가이드 & 샘플 카드 쿼리
- **스토어 제출 세트**: App Store/Play 마켓 카피(ko), 키워드, 스크린샷 **SVG 템플릿 6종**
- **환경설정**: .env 예시 업데이트(번역/푸시/스토리지/영수증)

## Environment & Security Notes
- Copy `.env.example` to `.env` files for each service and fill in real secrets before running locally or deploying.
- `DATABASE_URL`, `JWT_SECRET`, and `NEXT_PUBLIC_TOK_API_BASE` are required for the API and admin clients to communicate.
- `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are required when running `prisma db seed`; remove or rotate the bootstrap credentials immediately after use.
- Never commit real secrets. Prefer encrypted secrets management (Render/Vercel dashboard, GitHub Actions secrets) over checked-in values.
