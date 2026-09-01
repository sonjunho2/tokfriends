# tokfriends 앱 기준 교차검증 수정 제안

생성시각: 2025-01-04T00:00:00.000Z

## 요약

- 분석한 클라이언트 호출 합계: 77
- API와 일치한 호출: 67
- **API에 없는 호출(추가 필요)**: 10
- **인증 불일치**: 6
- **클라이언트가 쓰지 않는 API(정리 후보)**: 0

## 1) API에 추가가 필요해 보이는 엔드포인트

- `POST /auth/otp/request` — 앱 인증: none — 예: [(src/api/client.js, requestPhoneOtp)]
- `POST /auth/phone/confirm` — 앱 인증: none — 예: [(src/api/client.js, verifyPhoneOtp)]
- `POST /auth/otp/verify` — 앱 인증: none — 예: [(src/api/client.js, verifyPhoneOtp)]
- `POST /otp/verify` — 앱 인증: none — 예: [(src/api/client.js, verifyPhoneOtp)]
- `POST /chat/direct` — 앱 인증: auto-bearer — 예: [(src/api/client.js, ensureDirectRoom)]
- `POST /chat/rooms/direct` — 앱 인증: auto-bearer — 예: [(src/api/client.js, ensureDirectRoom)]
- `POST /conversations/direct` — 앱 인증: auto-bearer — 예: [(src/api/client.js, ensureDirectRoom)]
- `GET /cms/pages/{key}` — 앱 인증: auto-bearer — 예: [(src/api/client.js, getLegalDocument)]
- `GET /legal/{key}` — 앱 인증: auto-bearer — 예: [(src/api/client.js, getLegalDocument)]
- `GET /policies/{key}` — 앱 인증: auto-bearer — 예: [(src/api/client.js, getLegalDocument)]

## 2) 인증 정책이 서로 다른 엔드포인트

- `GET /health` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, health)]
- `POST /auth/phone/verify` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, verifyPhoneOtp)]
- `POST /auth/phone/complete-profile` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, completePhoneSignup)]
- `GET /legal-documents/{slug}` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, getLegalDocument)]
- `GET /gifts` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, getGiftOptions)]
- `GET /announcements/active` — API 요구: none, 앱 전송: bearerAuth — 예: [(src/api/client.js, getActiveAnnouncements)]

## 3) 앱에서 사용되지 않는 API (정리 검토)

- (없음)
