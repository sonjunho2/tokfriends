# API 개선 제안

1. **Public 엔드포인트 명시**
   - 현재 `/announcements`, `/announcements/active`, `/icebreakers` 등은 실사용상 공개용이지만 `@Public()` 데코레이터가 없어 기본 JWT 가드에 차단됩니다. 공개 API로 유지하려면 `@Public()`을 부여하거나 Swagger 문서에 인증 요구 사항을 명확히 안내해야 합니다.

2. **관리자 가드 정비**
   - `services/api/src/modules/admin/admin.controller.ts`는 커스텀 `JwtGuard`가 토큰 검증을 생략하고 있습니다. 운영 환경에서는 Passport 기반 `JwtAuthGuard`와 역할 검증을 사용하도록 통합하는 것이 안전합니다.

3. **중복 라우트 정리**
   - `chats.controller.ts`와 `auth.controller.ts`에는 동일한 핸들러에 다수의 경로 별칭이 지정되어 있습니다. 클라이언트 추적과 문서 유지보수를 위해 대표 경로만 남기고 리다이렉트/별칭 처리를 미들웨어로 이관하는 방안을 검토하세요.

4. **스키마 응답 표준화**
   - 일부 응답(`admin/users`, `admin/refunds` 등)은 Prisma 객체를 그대로 반환합니다. 공용 인터페이스를 위해 DTO/Serializer를 도입해 노출 필드와 포맷을 명시하면 좋습니다.

5. **오류 코드 통일**
   - `auth.service.ts` 등에서는 `BadRequestException`/`UnauthorizedException`이 혼재되어 있습니다. 클라이언트 대응을 위해 에러 메시지와 상태 코드를 표준화하거나 에러 코드를 payload에 포함하는 개선이 필요합니다.
