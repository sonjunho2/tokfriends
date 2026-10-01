-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "SettlementRequest" (
    "id" TEXT NOT NULL,
    "activityAccountId" TEXT NOT NULL,
    "pointsAmount" INTEGER NOT NULL,
    "krwAmount" INTEGER NOT NULL,
    "taxAmount" INTEGER NOT NULL DEFAULT 0,
    "netAmount" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "idCardNumberHash" TEXT,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "adminMemo" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettlementRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SettlementRequest_activityAccountId_createdAt_idx" ON "SettlementRequest"("activityAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "SettlementRequest_status_createdAt_idx" ON "SettlementRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SettlementRequest" ADD CONSTRAINT "SettlementRequest_activityAccountId_fkey" FOREIGN KEY ("activityAccountId") REFERENCES "ActivityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementRequest" ADD CONSTRAINT "SettlementRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
