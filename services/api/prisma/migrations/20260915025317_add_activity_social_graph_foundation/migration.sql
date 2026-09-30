-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerAccountId" TEXT NOT NULL,
    "followingAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Interest" (
    "id" TEXT NOT NULL,
    "senderAccountId" TEXT NOT NULL,
    "targetAccountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileVisit" (
    "id" TEXT NOT NULL,
    "visitorAccountId" TEXT NOT NULL,
    "visitedAccountId" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileVisit_pkey" PRIMARY KEY ("id")
);

-- Prevent self-referential social graph edges
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_accounts_distinct" CHECK ("followerAccountId" <> "followingAccountId");

ALTER TABLE "Interest" ADD CONSTRAINT "Interest_accounts_distinct" CHECK ("senderAccountId" <> "targetAccountId");

ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_accounts_distinct" CHECK ("visitorAccountId" <> "visitedAccountId");

-- CreateIndex
CREATE INDEX "Follow_followerAccountId_createdAt_idx" ON "Follow"("followerAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "Follow_followingAccountId_createdAt_idx" ON "Follow"("followingAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerAccountId_followingAccountId_key" ON "Follow"("followerAccountId", "followingAccountId");

-- CreateIndex
CREATE INDEX "Interest_senderAccountId_createdAt_idx" ON "Interest"("senderAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "Interest_targetAccountId_createdAt_idx" ON "Interest"("targetAccountId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Interest_senderAccountId_targetAccountId_key" ON "Interest"("senderAccountId", "targetAccountId");

-- CreateIndex
CREATE INDEX "ProfileVisit_visitorAccountId_visitedAt_idx" ON "ProfileVisit"("visitorAccountId", "visitedAt");

-- CreateIndex
CREATE INDEX "ProfileVisit_visitedAccountId_visitedAt_idx" ON "ProfileVisit"("visitedAccountId", "visitedAt");

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerAccountId_fkey" FOREIGN KEY ("followerAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingAccountId_fkey" FOREIGN KEY ("followingAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interest" ADD CONSTRAINT "Interest_targetAccountId_fkey" FOREIGN KEY ("targetAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_visitorAccountId_fkey" FOREIGN KEY ("visitorAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileVisit" ADD CONSTRAINT "ProfileVisit_visitedAccountId_fkey" FOREIGN KEY ("visitedAccountId") REFERENCES "ActivityAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
