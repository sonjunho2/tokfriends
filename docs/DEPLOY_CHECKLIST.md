# TokFriends 실서버 배포 점검 체크리스트

## 1. API 서버 (Render)
- [ ] Render 서비스 상태 확인 (`Health Check` 통과)
- [ ] `PORT=4000` 환경변수 적용됨
- [ ] `DATABASE_URL` 연결 정상 (Prisma 마이그레이션 완료)
- [ ] `JWT_SECRET` 강력한 값으로 설정됨
- [ ] `CORS_ORIGIN`에 다음 도메인 포함:
  - https://tokfriends-admin.vercel.app
  - https://tokfriends.app
  - https://www.tokfriends.app
  - http://localhost:3000 (개발용)

## 2. Admin 앱 (Vercel)
- [ ] `NEXT_PUBLIC_TOK_API_BASE=https://tok-friends-api.onrender.com` 설정됨
- [ ] `/login` 접근 → 정상 로그인 → JWT가 `localStorage[tokfriends.admin.jwt]`에 저장되는지 확인
- [ ] 로그인 후 메트릭스/공지/신고/유저/검수 페이지 이동 가능
- [ ] 로그아웃 버튼 → `/login` 복귀 확인
- [ ] i18n (한국어/English) 토글 확인
- [ ] 다크모드 토글 확인

## 3. 사용자 앱 (Expo)
- [ ] `.env`의 `TOK_API_BASE`가 `https://tok-friends-api.onrender.com`로 설정됨
- [ ] 로그인 → 친구 탐색 → 친구 요청/수락 → 채팅까지 시나리오 정상 작동
- [ ] WebSocket 연결 확인 (`wss://tok-friends-api.onrender.com`)

## 4. 보안 점검
- [ ] Render/Vercel 환경변수에 민감정보 노출 없음
- [ ] 관리자 JWT는 `.env` 대신 **로그인 발급**만 사용
- [ ] HTTPS 연결만 허용 (HTTP 접근 시 자동 리다이렉트)

## 5. 문서/테스트
- [ ] `docs/E2E_SCENARIOS.md` 시나리오 실행 성공
- [ ] `docs/ADMIN_README.md` 가이드 최신화 완료
- [ ] `docs/QUICK_TEST.md` 절차 5분 내 테스트 가능
- [ ] Postman 컬렉션(`docs/postman/tokfriends.postman_collection.json`)으로 API 호출 성공

---
✅ 위 항목 전부 체크 후에만 실사용 시작
