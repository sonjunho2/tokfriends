# Analytics / Metabase
- Metabase는 기본적으로 Postgres에 연결하여 `queries.sql`의 쿼리로 카드/대시보드를 생성하세요.
- ClickHouse를 사용할 경우 ETL로 Postgres 데이터를 적재한 뒤 동일한 구조로 뷰를 만들면 됩니다.

## Docker (Metabase) 추가
`infra/docker-compose.yml`에 다음을 참고하여 Metabase 서비스를 추가하세요:
```
  metabase:
    image: metabase/metabase:latest
    ports: ["3001:3000"]
    environment:
      - MB_DB_FILE=/metabase.db
```
이후 Metabase에서 Postgres 연결을 설정하세요.
