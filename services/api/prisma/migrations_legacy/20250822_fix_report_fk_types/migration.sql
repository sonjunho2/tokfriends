-- 20250822_fix_report_fk_types

-- 1) 먼저 기존 FK 제약을 제거합니다(여러 번 실행 대비 IF EXISTS).
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_reporterId_fkey";
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_reportedId_fkey";
ALTER TABLE "Report" DROP CONSTRAINT IF EXISTS "Report_postId_fkey";

-- 2) Report 테이블이 비어있는지 확인합니다.
DO $block$
DECLARE
  _cnt BIGINT;
BEGIN
  SELECT COUNT(*) INTO _cnt FROM "Report";
  IF _cnt > 0 THEN
    RAISE EXCEPTION 'Report table is not empty (%). Abort safe drop-recreate migration.', _cnt;
  END IF;
END
$block$;

-- 3) 비어있다면 3개 FK 컬럼을 드롭 후 UUID 타입으로 다시 생성합니다.
ALTER TABLE "Report"
  DROP COLUMN IF EXISTS "reporterId",
  DROP COLUMN IF EXISTS "reportedId",
  DROP COLUMN IF EXISTS "postId";

ALTER TABLE "Report"
  ADD COLUMN "reporterId" uuid,
  ADD COLUMN "reportedId" uuid,
  ADD COLUMN "postId"     uuid;

-- (선택) reporterId 가 반드시 있어야 한다면 NOT NULL 제약을 추가하세요.
-- ALTER TABLE "Report" ALTER COLUMN "reporterId" SET NOT NULL;

-- 4) FK 재설정 (UUID → UUID)
ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_reportedId_fkey"
    FOREIGN KEY ("reportedId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Report"
  ADD CONSTRAINT "Report_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;
