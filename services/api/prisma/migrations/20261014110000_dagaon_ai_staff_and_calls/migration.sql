-- 20261014110000_dagaon_ai_staff_and_calls

DO $$ BEGIN
    CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'WARNING', 'SUSPENDED', 'BANNED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('USER', 'CREATOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "CallStatus" AS ENUM ('RINGING', 'CONNECTED', 'TERMINATED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AiDecisionStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'MODIFIED');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "AiTargetDomain" AS ENUM ('LIVE_STREAM_SAFETY', 'PRIVATE_CALL_DISPUTE', 'REPORT_SAFETY', 'CREATOR_SETTLEMENT', 'CONTENT_MODERATION');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" VARCHAR(200),
    "pointBalance" INTEGER NOT NULL DEFAULT 0,
    "callRatePerMinute" INTEGER,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- UserPhoto
CREATE TABLE IF NOT EXISTS "UserPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- SystemSetting
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- PrivateCallSession
CREATE TABLE IF NOT EXISTS "PrivateCallSession" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "ratePerMinute" INTEGER NOT NULL,
    "billedMinutes" INTEGER NOT NULL DEFAULT 0,
    "totalDeducted" INTEGER NOT NULL DEFAULT 0,
    "platformFee" INTEGER NOT NULL DEFAULT 0,
    "creatorRevenue" INTEGER NOT NULL DEFAULT 0,
    "status" "CallStatus" NOT NULL DEFAULT 'RINGING',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "endReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PrivateCallSession_pkey" PRIMARY KEY ("id")
);

-- GiftTransaction
CREATE TABLE IF NOT EXISTS "GiftTransaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "channelId" TEXT,
    "giftName" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "effectTier" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftTransaction_pkey" PRIMARY KEY ("id")
);

-- StreamSnapshotAudit
CREATE TABLE IF NOT EXISTS "StreamSnapshotAudit" (
    "id" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "snapshotUrl" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "isViolated" BOOLEAN NOT NULL DEFAULT false,
    "violationTags" JSONB,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StreamSnapshotAudit_pkey" PRIMARY KEY ("id")
);

-- AiDecisionQueue
CREATE TABLE IF NOT EXISTS "AiDecisionQueue" (
    "id" SERIAL NOT NULL,
    "domain" "AiTargetDomain" NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetUserId" TEXT,
    "riskScore" INTEGER NOT NULL,
    "summary" TEXT NOT NULL,
    "evidence" TEXT,
    "snapshotUrls" JSONB,
    "directorReview" TEXT,
    "recommendedAction" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "status" "AiDecisionStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminMemo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiDecisionQueue_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_key" ON "User"("nickname");
CREATE INDEX IF NOT EXISTS "UserPhoto_userId_order_idx" ON "UserPhoto"("userId", "order");
CREATE UNIQUE INDEX IF NOT EXISTS "PrivateCallSession_channelId_key" ON "PrivateCallSession"("channelId");
CREATE INDEX IF NOT EXISTS "PrivateCallSession_hostId_guestId_idx" ON "PrivateCallSession"("hostId", "guestId");
CREATE INDEX IF NOT EXISTS "GiftTransaction_channelId_createdAt_idx" ON "GiftTransaction"("channelId", "createdAt");
CREATE INDEX IF NOT EXISTS "StreamSnapshotAudit_channelId_isViolated_idx" ON "StreamSnapshotAudit"("channelId", "isViolated");
CREATE INDEX IF NOT EXISTS "StreamSnapshotAudit_capturedAt_idx" ON "StreamSnapshotAudit"("capturedAt");
CREATE INDEX IF NOT EXISTS "AiDecisionQueue_domain_status_idx" ON "AiDecisionQueue"("domain", "status");

-- Foreign Keys (Safe execution)
DO $$ BEGIN
    ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PrivateCallSession" ADD CONSTRAINT "PrivateCallSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PrivateCallSession" ADD CONSTRAINT "PrivateCallSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AiDecisionQueue" ADD CONSTRAINT "AiDecisionQueue_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
