# CI 점검 체크리스트

- [ ] `pnpm lint` 또는 `pnpm run lint` 실행
- [ ] `pnpm test` (단위 테스트) 실행
- [ ] Prisma 마이그레이션 상태 확인: `pnpm prisma migrate status`
- [ ] OpenAPI 문서 최신화 여부 확인 (`_contract/openapi.yaml` 비교)
- [ ] 환경 변수 (`.env`) 값 검증 및 비밀 키 배포 절차 점검
