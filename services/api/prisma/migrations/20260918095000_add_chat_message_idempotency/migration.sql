-- AlterTable
ALTER TABLE "Message" ADD COLUMN "clientMessageId" VARCHAR(128);

-- CreateIndex
CREATE UNIQUE INDEX "Message_senderAccountId_clientMessageId_key"
ON "Message"("senderAccountId", "clientMessageId");
