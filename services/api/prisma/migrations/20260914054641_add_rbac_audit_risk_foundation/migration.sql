-- CreateEnum
CREATE TYPE "AdminApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "context" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "reason" TEXT;

-- CreateTable
CREATE TABLE "AdminApprovalRequest" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "context" JSONB,
    "metadata" JSONB,
    "status" "AdminApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "idempotencyKey" TEXT,
    "requestedById" TEXT NOT NULL,
    "decidedById" TEXT,
    "decisionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminApprovalRequest_idempotencyKey_key" ON "AdminApprovalRequest"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AdminApprovalRequest_status_createdAt_idx" ON "AdminApprovalRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AdminApprovalRequest_requestedById_status_idx" ON "AdminApprovalRequest"("requestedById", "status");

-- CreateIndex
CREATE INDEX "AdminApprovalRequest_target_action_idx" ON "AdminApprovalRequest"("target", "action");

-- AddForeignKey
ALTER TABLE "AdminApprovalRequest" ADD CONSTRAINT "AdminApprovalRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminApprovalRequest" ADD CONSTRAINT "AdminApprovalRequest_decidedById_fkey" FOREIGN KEY ("decidedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
