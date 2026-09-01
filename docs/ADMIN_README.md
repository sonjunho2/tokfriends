# TokFriends Admin 사용 가이드 (운영)

## 1) 로그인
- 경로: `/login`
- 이메일/비밀번호로 로그인 → 성공 시 JWT는 `localStorage[tokfriends.admin.jwt]`에 저장
- JWT가 없으면 `AuthGuard`가 자동으로 `/login` 리다이렉트

## 2) 주요 메뉴
- 메트릭스: 서비스 지표 조회(정렬 지원)
- 공지사항: 등록/삭제 (목록 정렬, Empty 상태 표시)
- 신고 관리: 상태 전환(PENDING/REVIEWING/RESOLVED/REJECTED)
- 유저 관리: 검색/상태 변경(활성화/정지)
- 콘텐츠 검수: 포스트 신고 기반 승인/반려/차단

## 3) 언어/테마
- 우상단 **한국어/English** 전환 (브라우저 `localStorage` 저장)
- 다크/라이트 모드 토글 (HTML `dark` 클래스)

## 4) 장애 대응
- 401/403: 로그인 토큰 만료 → `/login` 재로그인
- CORS 오류: Render의 `CORS_ORIGIN` 리스트에 Vercel 도메인 포함 확인
- 빈 목록/에러: API 서버 상태 및 네트워크 점검

## 5) 보안
- 운영 환경에서 `.env`에 API Base만 노출, JWT는 브라우저 저장만 사용
- 관리자 계정 분리 및 강한 비밀번호 사용
