# TODO from diff-report (app-based)

## Metrics
- missingCalls: 10
- mismatchedAuth: 6

## Missing Calls (최대 10개)
- POST /auth/otp/request — 추정 수정 대상 파일: src/api/client.js
- POST /auth/phone/confirm — 추정 수정 대상 파일: src/api/client.js
- POST /auth/otp/verify — 추정 수정 대상 파일: src/api/client.js
- POST /otp/verify — 추정 수정 대상 파일: src/api/client.js
- POST /chat/direct — 추정 수정 대상 파일: src/api/client.js
- POST /chat/rooms/direct — 추정 수정 대상 파일: src/api/client.js
- POST /conversations/direct — 추정 수정 대상 파일: src/api/client.js
- GET /cms/pages/{key} — 추정 수정 대상 파일: src/api/client.js
- GET /legal/{key} — 추정 수정 대상 파일: src/api/client.js
- GET /policies/{key} — 추정 수정 대상 파일: src/api/client.js

## Auth Mismatches (최대 10개)
- GET /health — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js
- POST /auth/phone/verify — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js
- POST /auth/phone/complete-profile — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js
- GET /legal-documents/{slug} — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js
- GET /gifts — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js
- GET /announcements/active — expected: api_requires_auth:false / client: bearerAuth — 추정 수정 파일: src/api/client.js

## Next Actions (아주 짧게)
1) 위 목록의 맨 위 1개만 먼저 고친다.
2) “Fix-One” 프롬프트를 돌려 최종 파일 본문을 받아, 해당 파일에 그대로 붙여넣고 main에 커밋.
3) 재검증 프롬프트(1단계)를 다시 돌려 숫자를 갱신한다.
