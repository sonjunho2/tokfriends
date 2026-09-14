-- CreateTable
CREATE TABLE "Owner" (
    "id" TEXT NOT NULL,
    "legacyUserId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Owner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityAccount" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "legacyUserId" TEXT,
    "handle" TEXT,
    "displayName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Owner_legacyUserId_key" ON "Owner"("legacyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAccount_legacyUserId_key" ON "ActivityAccount"("legacyUserId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityAccount_handle_key" ON "ActivityAccount"("handle");

-- CreateIndex
CREATE INDEX "ActivityAccount_ownerId_idx" ON "ActivityAccount"("ownerId");

-- CreateIndex
CREATE INDEX "ActivityAccount_ownerId_isPrimary_idx" ON "ActivityAccount"("ownerId", "isPrimary");

-- AddForeignKey
ALTER TABLE "Owner" ADD CONSTRAINT "Owner_legacyUserId_fkey" FOREIGN KEY ("legacyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAccount" ADD CONSTRAINT "ActivityAccount_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Owner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityAccount" ADD CONSTRAINT "ActivityAccount_legacyUserId_fkey" FOREIGN KEY ("legacyUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill existing users into the new Owner / ActivityAccount foundation.
-- Existing User rows remain unchanged and continue to power the current application.
INSERT INTO "Owner" (
    "id",
    "legacyUserId",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'owner_' || "id",
    "id",
    "status",
    "createdAt",
    "updatedAt"
FROM "User";

INSERT INTO "ActivityAccount" (
    "id",
    "ownerId",
    "legacyUserId",
    "displayName",
    "status",
    "isPrimary",
    "createdAt",
    "updatedAt"
)
SELECT
    'activity_' || "id",
    'owner_' || "id",
    "id",
    "displayName",
    "status",
    TRUE,
    "createdAt",
    "updatedAt"
FROM "User";
