
5) 새파일 `tok-friends/README_DEPLOY.md`
```md
# TokFriends 배포 가이드

## API (Render)
- Repository Root: `tok-friends`
- Service RootDir: `services/api`
- Build: `npm install && npm run build`
- Start: `npm run start:prod`
- Node: `20`
- Health Check: `/health`

### 필수 환경변수(Render)
- `PORT=4000`
- `DATABASE_URL=...`
- `JWT_SECRET=...`
- `CORS_ORIGIN=https://tokfriends-admin.vercel.app,https://tokfriends.app,https://www.tokfriends.app,http://localhost:3000`
- (선택) `API_PREFIX=v1`

### 시드 작업용 환경변수
- `SEED_ADMIN_EMAIL=...`
- `SEED_ADMIN_PASSWORD=...`

## Admin (Vercel)
- Root Directory: `tok-friends/apps/admin`
- Env: `NEXT_PUBLIC_TOK_API_BASE=https://tok-friends-api.onrender.com`
- 로그인 경로: `/login` (JWT는 localStorage에 저장)
```
