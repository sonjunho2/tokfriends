# tokfriends 앱 기준 교차검증 수정 제안

생성시각: 2025-10-29T05:48:03.643503+00:00

## 요약

- 분석한 클라이언트 호출 합계: 141
- API와 일치한 호출: 35
- **API에 없는 호출(추가 필요)**: 106
- **인증 불일치**: 13
- **클라이언트가 쓰지 않는 API(정리 후보)**: 36

## 1) API에 추가가 필요해 보이는 엔드포인트

- `DELETE /admin/settings/team/{memberId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'deleteAdminTeamMember')]
- `DELETE /gifts/{giftId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'deleteGift')]
- `DELETE /matches/quick-filters/{filterId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'deleteMatchQuickFilter')]
- `DELETE /posts/{postId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'deletePost')]
- `DELETE /store/point-products/{productId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'deletePointProduct')]
- `DELETE {url}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:120')]
- `GET /admin/settings/snapshot` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getAdminSettingsSnapshot')]
- `GET /analytics/overview` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getAnalyticsOverview')]
- `GET /chats/control-panel` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getChatSafetySnapshot')]
- `GET /cms/pages/{key}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:371')]
- `GET /legal-documents/{key}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:371')]
- `GET /legal-documents/{slug}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getLegalDocument')]
- `GET /legal/{key}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:371')]
- `GET /matches/control-panel` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getMatchControlPanelSnapshot')]
- `GET /payments/products` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:442')]
- `GET /policies/{key}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:371')]
- `GET /shop/points` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:442')]
- `GET /store/products` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:442')]
- `GET /topics/{topicId}/posts` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:515'), ('admin-web/src/lib/api.ts', 'listTopicPosts')]
- `GET /users/{userId}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:503'), ('admin-web/src/lib/api.ts', 'getUserById')]
- `GET /verifications/phone/otp-logs` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getPhoneOtpLogs')]
- `GET /verifications/phone/pending` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'getPendingPhoneVerifications')]
- `GET https:/manage.tokfriends.app/api/fonts/latest` 추가 필요 — 예: [('src/screens/my/SettingsScreen.js', 'anonymous@SettingsScreen.js:123')]
- `GET url` 추가 필요 — 예: [('admin-web/src/components/recent-reports.tsx', 'RecentReports > (anonymous) > run')]
- `GET {url}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:100')]
- `PATCH /admin/settings/feature-flags/{flagId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAdminFeatureFlag')]
- `PATCH /admin/settings/integrations/{settingId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAdminIntegrationSetting')]
- `PATCH /admin/settings/team/{memberId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAdminTeamMember')]
- `PATCH /analytics/metrics/{metricId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAnalyticsMetric')]
- `PATCH /analytics/report-jobs/{jobId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAnalyticsReportJob')]
- `PATCH /announcements/{announcementId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateAnnouncement')]
- `PATCH /chats/policy-rules/{ruleId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateChatPolicyRule')]
- `PATCH /chats/rooms/{roomId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateChatRoom')]
- `PATCH /gifts/{giftId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateGift')]
- `PATCH /matches/presets/{presetId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateMatchPreset')]
- `PATCH /matches/recommendation-pools/{poolId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateMatchRecommendationPool')]
- `PATCH /posts/{postId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updatePost')]
- `PATCH /users/{userId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updateUserProfile')]
- `PATCH {url}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:115')]
- `POST /admin/settings/audit-log` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'saveAdminAuditMemo')]
- `POST /admin/settings/team` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createAdminTeamMember')]
- `POST /analytics/exports` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createAnalyticsExport')]
- `POST /analytics/metrics` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createAnalyticsMetric')]
- `POST /analytics/report-jobs/{jobId}/{active-activate-deactivate-}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'toggleAnalyticsReportJob')]
- `POST /announcements` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createAnnouncement')]
- `POST /auth/login` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:130')]
- `POST /auth/login/phone` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'loginWithPhone')]
- `POST /auth/otp/request` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:250')]
- `POST /auth/otp/verify` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:288')]
- `POST /auth/phone/confirm` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:288')]
- `POST /auth/phone/send-otp` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:250')]
- `POST /auth/phone/signup` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:327')]
- `POST /auth/register` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /auth/signup` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /auth/signup/phone` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:327')]
- `POST /chat/direct` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:399')]
- `POST /chat/rooms` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:214'), ('src/api/client.js', 'anonymous@client.js:214')]
- `POST /chat/rooms/direct` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:399')]
- `POST /chats/control-panel/memo` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'saveChatSafetyMemo')]
- `POST /chats/reports/{reportId}/resolve` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'resolveChatReport')]
- `POST /chats/rooms/direct` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:399')]
- `POST /conversations` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:214'), ('src/api/client.js', 'anonymous@client.js:214')]
- `POST /conversations/direct` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:399')]
- `POST /gifts` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createGift')]
- `POST /iap/confirm` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:469')]
- `POST /matches/heat-map/memo` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'saveMatchHeatMemo')]
- `POST /matches/presets/{presetId}/activate` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'activateMatchPreset')]
- `POST /matches/presets/{presetId}/duplicate` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'duplicateMatchPreset')]
- `POST /matches/quick-filters` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createMatchQuickFilter')]
- `POST /otp/request` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:250')]
- `POST /otp/send` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:250')]
- `POST /otp/verify` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:288')]
- `POST /payments/confirm` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:469')]
- `POST /register` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /rooms` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:214'), ('src/api/client.js', 'anonymous@client.js:214')]
- `POST /signup` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /store/point-products` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'createPointProduct')]
- `POST /store/point-products/reorder` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'syncPointProductOrder')]
- `POST /users` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /users/register` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /users/signup` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:172'), ('src/api/client.js', 'anonymous@client.js:172')]
- `POST /users/signup/phone` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:327')]
- `POST /verifications/phone/manual-complete` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'completePhoneVerificationProfile')]
- `POST /verifications/phone/{verificationId}/approve` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'approvePhoneVerification')]
- `POST /verifications/phone/{verificationId}/expire` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'expirePhoneVerificationSession')]
- `POST /verifications/phone/{verificationId}/resend` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'resendPhoneOtp')]
- `POST url` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'postJson'), ('admin-web/src/lib/api.ts', 'postForm')]
- `POST {p}` 추가 필요 — 예: [('src/api/client.js', 'tryPostJsonSequential'), ('src/api/client.js', 'tryPostFormSequential')]
- `POST {url}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:105')]
- `PUT /legal-documents/{slug}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'saveLegalDocument')]
- `PUT /store/point-products/{productId}` 추가 필요 — 예: [('admin-web/src/lib/api.ts', 'updatePointProduct')]
- `PUT {url}` 추가 필요 — 예: [('src/api/client.js', 'anonymous@client.js:110')]

권장 조치:


- API 레포(openapi.yaml)에 위 경로를 추가하고, 컨트롤러/서비스/테스트/문서를 함께 업데이트
- 클라이언트에서 동등 기능이 여러 경로 후보를 시도하는 경우(예: /signup, /auth/signup 등), **하나로 표준화**하고 나머지 경로는 301/410 처리
- 스키마는 앱 사용 코드를 기준으로 최소 필수 필드를 정의하고, nullable/optional 여부를 명시


## 2) 인증 정책 불일치 조정

- `GET /health` ↔ OAS `GET /health`: Client sends auth but API declares no auth
- `POST /auth/phone/verify` ↔ OAS `POST /auth/phone/verify`: Client sends auth but API declares no auth
- `POST /auth/phone/complete-profile` ↔ OAS `POST /auth/phone/complete-profile`: Client sends auth but API declares no auth
- `GET /store/point-products` ↔ OAS `GET /store/point-products`: Client sends auth but API declares no auth
- `GET /gifts` ↔ OAS `GET /gifts`: Client sends auth but API declares no auth
- `GET /metrics/dashboard` ↔ OAS `GET /metrics/dashboard`: Client sends no auth but API requires auth
- `GET /users/search` ↔ OAS `GET /users/search`: Client sends no auth but API requires auth
- `POST /community/report` ↔ OAS `POST /community/report`: Client sends no auth but API requires auth
- `POST /community/block` ↔ OAS `POST /community/block`: Client sends no auth but API requires auth
- `GET /topics` ↔ OAS `GET /topics`: Client sends no auth but API requires auth
- `GET /posts` ↔ OAS `GET /posts`: Client sends no auth but API requires auth
- `GET /announcements` ↔ OAS `GET /announcements`: Client sends no auth but API requires auth
- `GET /announcements/active` ↔ OAS `GET /announcements/active`: Client sends no auth but API requires auth

권장 조치:


- OpenAPI의 security 스키마와 실제 미들웨어(JWT/세션)를 일치시키고, 공개 엔드포인트는 security: []로 명시
- 클라이언트의 로그인/회원가입 호출은 보통 '무인증'이어야 하며, 나머지는 Bearer 토큰을 붙이도록 통일
- 관리자(Admin)는 쿠키 기반(withCredentials)이라면 CORS/Set-Cookie/SameSite 설정을 API에 맞춰 검증


## 3) 사용되지 않는 API 정리 후보

- `GET /` — Redirect to docs
- `POST /auth/apple` — Apple login
- `PATCH /users/{id}` — Update profile
- `GET /users/{id}` — Get user
- `GET /admin/users` — Admin list users
- `GET /admin/users/{id}` — Admin user detail
- `PATCH /admin/users/{id}` — Admin update user
- `PATCH /admin/users/{id}/status` — Admin update status
- `POST /admin/users/{id}/notes` — Admin add note
- `POST /admin/users/{id}/actions/resend-verification` — Log resend verification
- `POST /admin/users/{id}/actions/password-reset` — Log password reset
- `POST /admin/users/{id}/actions/escalate` — Log escalate
- `GET /topics/{id}/posts` — Posts by topic
- `GET /discover` — Discover users
- `POST /friendships` — Send friend request
- `GET /friendships` — List friend requests
- `POST /friendships/{id}/accept` — Accept friend
- `POST /friendships/{id}/decline` — Decline friend
- `POST /friendships/{id}/cancel` — Cancel friend
- `GET /chats` — List chats
- `POST /chats/message` — Send message
- `GET /legal-documents/{slug}` — Get legal document
- `GET /admin/announcements` — Admin list announcements
- `POST /admin/announcements` — Create announcement
- `PATCH /admin/announcements/{id}` — Update announcement
- `DELETE /admin/announcements/{id}` — Delete announcement
- `GET /admin/reports` — Admin list reports
- `GET /admin/reports/recent` — Recent reports
- `GET /metrics` — Metrics summary
- `POST /translate` — Translate text
- ...외 6개

## 4) 베이스 URL 및 환경변수 통일

- 앱 추정 baseUrls: ['https://tok-friends-api.onrender.com', 'https://manage.tokfriends.app']
- 관리자 기본 API 주소(fallback): https://tok-friends-api.onrender.com

권장 조치:
- 앱/관리자 모두 같은 API 도메인과 버전(prefix)을 사용하도록 `.env`를 통일 (`EXPO_PUBLIC_TOK_API_BASE`, `NEXT_PUBLIC_API_BASE_URL` 등)
- 개발/스테이징/프로덕션 환경별 값을 분리(예: .env.development, .env.production)
