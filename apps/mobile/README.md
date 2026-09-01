// README.md
# 딱친 (DdakChin) - Friend Matching App

실시간 친구 매칭 및 채팅 앱

## 기술 스택

- **Frontend**: React Native (Expo SDK 51)
- **Backend**: NestJS + Prisma + PostgreSQL
- **Database**: Neon PostgreSQL
- **Deployment**: Koyeb (Backend)
- **Build**: EAS Build

## 프로젝트 구조
ddakchin/
├── services/
│   └── api/              # NestJS 백엔드
│       ├── src/
│       ├── prisma/
│       └── package.json
├── tokfriends-app/       # Expo 앱 (이름 변경 예정)
│   ├── src/
│   │   ├── api/         # API 클라이언트
│   │   ├── components/  # 재사용 컴포넌트
│   │   ├── contexts/    # React Context
│   │   ├── navigation/  # 네비게이션 설정
│   │   ├── screens/     # 화면 컴포넌트
│   │   ├── store/       # 상태 관리
│   │   └── theme/       # 테마/색상
│   ├── assets/          # 이미지/폰트
│   ├── App.js
│   └── package.json
└── README.md

## 시작하기

### 백엔드 실행

```bash
cd services/api
pnpm install
pnpm prisma:generate
pnpm prisma:push
pnpm prisma:seed
pnpm start:dev
앱 실행
bashcd tokfriends-app
npm install
npm start

# iOS 시뮬레이터
npm run ios

# Android 에뮬레이터  
npm run android
환경 변수

### Expo 앱 (.env / app.config.js)

```bash
# .env
EXPO_PUBLIC_API_BASE_URL=https://tok-friends-api.onrender.com
```

- `EXPO_PUBLIC_API_BASE_URL`: API 서버 기본 URL. 배포/테스트 환경별로 값을 바꿔 주세요.
- 기본값은 `src/config/env.js` 에 정의되어 있으며, `.env` 값을 지정하면 우선합니다.

### Backend (.env)

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-frontend.com
```

> ⚠️ 민감한 값은 Git 저장소에 커밋하지 말고, 배포 환경의 비밀 변수로 관리하세요.
EAS Build
사전 준비

EAS CLI 설치

bashnpm install -g eas-cli
eas login

프로젝트 설정

basheas build:configure
빌드 명령
bash# Android APK (테스트용)
eas build --platform android --profile preview

# iOS 시뮬레이터 빌드
eas build --platform ios --profile preview

# Production 빌드
eas build --platform all --profile production
배포
Backend (Koyeb)

GitHub 연결
Build command: npm run heroku-build
Run command: npm start
환경변수 설정
Deploy

App Store / Play Store

EAS Submit 사용

basheas submit --platform ios
eas submit --platform android
주요 기능

📱 이메일 회원가입/로그인
👥 실시간 접속자 확인
📍 위치 기반 친구 찾기
💝 AI 친구 추천
💬 실시간 채팅
🎨 모던한 UI/UX

문제 해결
Expo 빌드 에러

expo doctor 실행하여 문제 확인
node_modules 재설치: rm -rf node_modules && npm install

API 연결 실패

app.json의 apiBaseUrl 확인
CORS 설정 확인
JWT_SECRET 환경변수 확인

### API 연결 상태 점검 스크립트

Expo 앱 없이도 API 응답을 확인하려면 프로젝트 루트에서 다음 명령을 실행합니다.

```
npm run check:api
```

`EXPO_PUBLIC_API_BASE_URL` 환경변수를 지정하면 해당 주소를 대상으로 `/health`, `/api/health`, `/` 순서로 요청합니다. 첫 번째 성공 응답을 받으면 즉시 종료하고, 모든 경로가 실패하면 마지막 오류 응답을 출력합니다.


이미지 로드 실패

assets 폴더 구조 확인
더미 이미지는 선택사항 (없어도 작동)

라이선스
Private
