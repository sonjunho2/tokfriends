# TokFriends Admin (Vercel)

## 1) 환경변수(Vercel Dashboard → Project → Settings → Environment Variables)
- `NEXT_PUBLIC_TOK_API_BASE` = `https://tok-friends-api.onrender.com`

> 배포 후 `/login`에서 관리자 계정으로 로그인하세요. 발급된 JWT는 브라우저 `localStorage`에 저장되며 API 호출 시 자동 사용됩니다.

## 2) 빌드 설정
- **Project Settings → Framework Preset**: Next.js
- **Root Directory**: `tok-friends/apps/admin`
- **Build Command / Output**: 자동

## 3) 로컬 개발
```bash
cd tok-friends/apps/admin
cp .env.example .env.local
# .env.local 에 NEXT_PUBLIC_TOK_API_BASE 값을 확인/수정
npm install
npm run dev
