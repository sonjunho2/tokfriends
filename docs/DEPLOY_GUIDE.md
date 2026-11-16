# 모꼬 (MOCCO) 통합 실행 및 배포 가이드

본 문서는 **모꼬 (MOCCO)** 프로젝트의 로컬 개발 환경 실행 및 프로덕션 배포 절차를 정리한 공식 가이드입니다.

---

## 1. 사전 요구사항 (Prerequisites)

- **Node.js**: v18.x ~ v20.x
- **Package Manager**: npm v9+
- **JDK**: Java 17 (Android 빌드용)
- **Android SDK**: Build Tools 36.0.0, Compile SDK 36, NDK 27.1.12297006
- **Database**: PostgreSQL (Prisma 연동)

---

## 2. 로컬 개발 환경 실행 방법

### 2.1 백엔드 API 서버 (`services/api`)
```bash
cd services/api
npm install
npx prisma generate
npm run start:dev
```
- API 서버: `http://localhost:4000/v1` (Swagger 문서: `http://localhost:4000/api`)
- 웹소켓: `ws://localhost:4000`

### 2.2 웹 포털 및 관리자 콘솔 (`apps/admin`)
```bash
cd apps/admin
npm install
npm run dev
```
- 웹 URL: `http://localhost:3000`

### 2.3 모바일 앱 (`apps/mobile`)
```bash
cd apps/mobile
npm install
npx expo start
```
- 안드로이드 에뮬레이터 실행: `npx expo run:android` 또는 Expo Go 앱을 통해 QR코드 스캔.

---

## 3. 릴리즈 APK 빌드 및 설치 방법

### 3.1 안드로이드 릴리즈 APK 빌드
```bash
cd apps/mobile/android
./gradlew assembleRelease
```
- 빌드 결과물: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
- 산출물 복사:
  ```bash
  copy apps\mobile\android\app\build\outputs\apk\release\app-release.apk build_output\mocco-release.apk
  ```

### 3.2 에뮬레이터 또는 실기기 설치
```bash
adb push apps/mobile/android/app/build/outputs/apk/release/app-release.apk /data/local/tmp/app_new.apk
adb shell pm install -r /data/local/tmp/app_new.apk
adb shell monkey -p com.sonjunho.ddakchin -c android.intent.category.LAUNCHER 1
```

---

## 4. 프로덕션 배포 파이프라인

### 4.1 웹 및 관리자 (`apps/admin`) -> Vercel 배포
- GitHub 저장소의 `main` 브랜치에 푸시(`git push origin main`)되면 Vercel CI/CD가 자동으로 트리거되어 `https://tokfriends.vercel.app`에 무중단 배포됩니다.

### 4.2 백엔드 API (`services/api`) -> Render 배포
- Render 대시보드에서 `tok-friends-api` 서비스가 GitHub 저장소와 연동되어 있습니다.
- 환경 변수:
  - `DATABASE_URL`: PostgreSQL 접속 문자열
  - `JWT_SECRET`: JWT 토큰 암호화 키
  - `AGORA_APP_ID` & `AGORA_APP_CERTIFICATE`: Agora RTC 연동 키

