# tokfriends-admin 웹 API 사용 개선 제안

1. **OpenAPI에 관리자 전용 엔드포인트 추가**  
   - 현재 클라이언트에서 호출하는 64건 중 41건이 스펙에 존재하지 않아 계약 검증이 불가능합니다.【F:_contract/diff-report-admin.json†L3-L9】  
   - 예: `/auth/login/phone`, `/posts/{postId}`, `/verifications/phone/*`, `/store/point-products/*` 등 다수의 관리자 전용 경로가 누락되었습니다.【F:_contract/diff-report-admin.json†L66-L425】  
   - **작업 제안:** 백엔드 라우터(예: NestJS 컨트롤러) 기준으로 OpenAPI 문서를 재생성하거나 수동으로 path 항목을 보강하고, 관리자 도메인(`admin/`, `verifications/`, `store/`)의 메서드·응답 스키마를 정의합니다.

2. **이미 정의된 경로의 메서드 불일치 해결**  
   - `/announcements`, `/gifts`, `/store/point-products`, `/legal-documents/{slug}` 등 일부 경로는 GET만 정의되어 있어 POST/PUT 요청이 계약상 허용되지 않습니다.【F:_contract/diff-report-admin.json†L248-L503】  
   - **작업 제안:** 실제 서버가 지원하는 작성·수정 메서드를 확인해 OpenAPI 문서에 method 를 추가하거나, 서버에서 미지원이라면 프런트 호출을 수정합니다.

3. **동적 fetch 호출도 계약 하위 레이어로 편입**  
   - `RecentReports` 컴포넌트는 임의 endpoint 문자열로 `fetch`를 수행하여 URL이 분석 시점에 고정되지 않습니다.【F:_contract/client-usage-admin.json†L17-L35】  
   - **작업 제안:** 해당 데이터를 `lib/api.ts`에 래핑된 axios 클라이언트를 통해 호출하거나, 최소한 표준화된 경로 상수와 스키마를 정의해 테스트 시 검증 가능하도록 합니다.

4. **기본 API 베이스 URL 안전장치 강화**  
   - 환경변수가 비어있으면 기본값이 즉시 운영 Render API로 지정됩니다.【F:admin-web/src/lib/api.ts†L9-L23】  
   - **작업 제안:** `.env.example`에 개발/스테이징 값을 명시하고, 빌드 시 필수 환경변수 미설정이면 실패하도록 가드(예: assert)나 CI 검증을 추가합니다.
