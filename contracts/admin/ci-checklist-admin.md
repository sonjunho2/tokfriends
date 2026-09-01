# CI 체크리스트 (tokfriends-admin 웹)

- [ ] `node scripts/analyze-admin-usage.js` 를 실행해 최신 HTTP 사용 현황과 차이를 업데이트합니다.【F:scripts/analyze-admin-usage.js†L368-L473】
- [ ] OpenAPI 문서에 새로 정의한 관리자 엔드포인트가 포함됐는지 확인하고, 스키마 lint 또는 `spectral lint`와 같은 계약 검증을 수행합니다.【F:_contract/diff-report-admin.json†L3-L9】
- [ ] `admin-web` 디렉터리에서 `npm run lint`를 실행해 클라이언트 빌드가 정적 분석을 통과하는지 확인합니다.【F:admin-web/package.json†L6-L12】
- [ ] 배포 전 `.env`/Render 설정에 `NEXT_PUBLIC_API_BASE_URL` 등 필수 환경변수가 설정되어 있는지 점검합니다.【F:admin-web/src/lib/api.ts†L9-L23】【F:render.yaml†L13-L16】
