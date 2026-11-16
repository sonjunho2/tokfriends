@echo off
chcp 65001 > nul
echo ====================================================
echo   MOCCO (모꼬) 로컬 통합 개발 환경 실행 스크립트
echo ====================================================
echo.
echo [1/3] Backend API (services/api: 포트 4000) 시작 중...
start "MOCCO Backend API (4000)" cmd /k "cd services\api && npm run start:dev"

timeout /t 3 > nul

echo [2/3] Admin & Web (apps/admin: 포트 3000) 시작 중...
start "MOCCO Admin & Web (3000)" cmd /k "cd apps\admin && npm run dev"

timeout /t 2 > nul

echo [3/3] Mobile Expo (apps/mobile: 포트 8081) 시작 중...
start "MOCCO Mobile App (Expo)" cmd /k "cd apps\mobile && npx expo start"

echo.
echo ✅ 모든 서비스가 별도 창에서 정상 실행되었습니다!
echo - 백엔드 API: http://localhost:4000/docs (Swagger)
echo - 웹/관리자: http://localhost:3000
echo - 모바일 앱: Expo Metro 번들러
echo ====================================================
pause
