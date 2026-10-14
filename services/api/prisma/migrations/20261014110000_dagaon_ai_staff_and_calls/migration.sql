-- 20261014110000_dagaon_ai_staff_and_calls (Failsafe & Idempotent)

-- 1. Create Enums if they do not exist
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

-- 2. Alter existing User table safely (Add columns if they don't exist)
DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "displayName" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER DEFAULT 0;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'email';
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" VARCHAR(200);
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pointBalance" INTEGER DEFAULT 0;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "callRatePerMinute" INTEGER;
EXCEPTION WHEN others THEN null;
END $$;

-- 3. Create User table if it does not exist at all
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "nickname" TEXT,
    "email" TEXT,
    "displayName" TEXT,
    "passwordHash" TEXT,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "provider" TEXT DEFAULT 'email',
    "avatarUrl" TEXT,
    "bio" VARCHAR(200),
    "pointBalance" INTEGER NOT NULL DEFAULT 0,
    "callRatePerMinute" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- 4. UserPhoto
CREATE TABLE IF NOT EXISTS "UserPhoto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserPhoto_pkey" PRIMARY KEY ("id")
);

-- 5. SystemSetting
CREATE TABLE IF NOT EXISTS "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- 6. PrivateCallSession
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

-- 7. GiftTransaction
CREATE TABLE IF NOT EXISTS "GiftTransaction" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT,
    "channelId" TEXT,
    "giftName" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "effectTier" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GiftTransaction_pkey" PRIMARY KEY ("id")
);

-- 8. StreamSnapshotAudit
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

-- 9. AiDecisionQueue
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

-- 10. AdminProfile
CREATE TABLE IF NOT EXISTS "AdminProfile" (
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MANAGER',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("userId")
);

-- 11. AdminFeatureFlag
CREATE TABLE IF NOT EXISTS "AdminFeatureFlag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "environment" TEXT NOT NULL DEFAULT 'production',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminFeatureFlag_pkey" PRIMARY KEY ("id")
);

-- 12. AdminIntegrationSetting
CREATE TABLE IF NOT EXISTS "AdminIntegrationSetting" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "placeholder" TEXT,
    "encryptedValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminIntegrationSetting_pkey" PRIMARY KEY ("id")
);

-- 13. AdminSettingsState
CREATE TABLE IF NOT EXISTS "AdminSettingsState" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "auditMemo" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSettingsState_pkey" PRIMARY KEY ("id")
);

-- 14. AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "target" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "context" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- 15. Safe Indexes
DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "User_nickname_key" ON "User"("nickname");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "UserPhoto_userId_order_idx" ON "UserPhoto"("userId", "order");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS "PrivateCallSession_channelId_key" ON "PrivateCallSession"("channelId");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "PrivateCallSession_hostId_guestId_idx" ON "PrivateCallSession"("hostId", "guestId");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "GiftTransaction_channelId_createdAt_idx" ON "GiftTransaction"("channelId", "createdAt");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "StreamSnapshotAudit_channelId_isViolated_idx" ON "StreamSnapshotAudit"("channelId", "isViolated");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "StreamSnapshotAudit_capturedAt_idx" ON "StreamSnapshotAudit"("capturedAt");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "AiDecisionQueue_domain_status_idx" ON "AiDecisionQueue"("domain", "status");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
EXCEPTION WHEN others THEN null;
END $$;

-- 16. Safe Foreign Keys
DO $$ BEGIN
    ALTER TABLE "UserPhoto" ADD CONSTRAINT "UserPhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PrivateCallSession" ADD CONSTRAINT "PrivateCallSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "PrivateCallSession" ADD CONSTRAINT "PrivateCallSession_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AiDecisionQueue" ADD CONSTRAINT "AiDecisionQueue_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN others THEN null;
END $$;
