/*
  Warnings:

  - A unique constraint covering the columns `[accountAId,accountBId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "accountAId" TEXT,
ADD COLUMN     "accountBId" TEXT;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "senderAccountId" TEXT;

-- AddCheckConstraint
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_activity_account_pair_complete_check" CHECK (
  ("accountAId" IS NULL AND "accountBId" IS NULL)
  OR
  ("accountAId" IS NOT NULL AND "accountBId" IS NOT NULL)
);

-- AddCheckConstraint
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_activity_account_self_check" CHECK (
  "accountAId" IS NULL OR "accountAId" <> "accountBId"
);

-- CreateIndex
CREATE INDEX "Chat_accountAId_lastMessageAt_idx" ON "Chat"("accountAId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Chat_accountBId_lastMessageAt_idx" ON "Chat"("accountBId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_accountAId_accountBId_key" ON "Chat"("accountAId", "accountBId");

-- CreateIndex
CREATE INDEX "Message_senderAccountId_createdAt_idx" ON "Message"("senderAccountId", "createdAt");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_accountAId_fkey" FOREIGN KEY ("accountAId") REFERENCES "ActivityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_accountBId_fkey" FOREIGN KEY ("accountBId") REFERENCES "ActivityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "ActivityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
