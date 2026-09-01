# TokFriends 로컬 작업 폴더 기준

Windows 권장 작업 경로:

`C:\Users\ION\Downloads\work\tokfriends`

GitHub 저장소:

`https://github.com/sonjunho2/tokfriends`

## 최종 폴더 구조

```text
C:\Users\ION\Downloads\work\tokfriends\
├─ apps\
│  ├─ mobile\
│  └─ admin\
├─ services\
│  └─ api\
├─ legacy\
│  └─ api-admin\
├─ infra\
├─ docs\
├─ contracts\
├─ analytics\
├─ store_assets\
├─ .gitignore
└─ README.md
```

## 첨부 원본 소스 매핑

- `tok-friends-api/tok-friends-main/services/api` → `services/api`
- `tokfriends-app/tokfriends-app-main` → `apps/mobile`
- `tokfriends-admin/tokfriends-admin-main/admin-web` → `apps/admin`
- `tok-friends-api/tok-friends-main/apps/admin` → `legacy/api-admin`

실제 `.env`, `debug.keystore`, `node_modules`, `.next`, `dist`, `build`, `.expo`는 복사/커밋하지 않습니다.
