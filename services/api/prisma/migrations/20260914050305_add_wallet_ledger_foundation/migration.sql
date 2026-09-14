-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "activityAccountId" TEXT NOT NULL,
    "spendableBalance" INTEGER NOT NULL DEFAULT 0,
    "redeemableBalance" INTEGER NOT NULL DEFAULT 0,
    "pendingEarnings" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletLedgerEntry" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "deltaSpendable" INTEGER NOT NULL DEFAULT 0,
    "deltaRedeemable" INTEGER NOT NULL DEFAULT 0,
    "deltaPending" INTEGER NOT NULL DEFAULT 0,
    "spendableAfter" INTEGER NOT NULL,
    "redeemableAfter" INTEGER NOT NULL,
    "pendingAfter" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletLedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_activityAccountId_key" ON "Wallet"("activityAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletLedgerEntry_idempotencyKey_key" ON "WalletLedgerEntry"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WalletLedgerEntry_walletId_createdAt_idx" ON "WalletLedgerEntry"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "WalletLedgerEntry_referenceType_referenceId_idx" ON "WalletLedgerEntry"("referenceType", "referenceId");

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_activityAccountId_fkey" FOREIGN KEY ("activityAccountId") REFERENCES "ActivityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletLedgerEntry" ADD CONSTRAINT "WalletLedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill one wallet for every existing ActivityAccount.
-- Existing User.pointsBalance remains unchanged during the transition.
INSERT INTO "Wallet" (
    "id",
    "activityAccountId",
    "spendableBalance",
    "redeemableBalance",
    "pendingEarnings",
    "status",
    "createdAt",
    "updatedAt"
)
SELECT
    'wallet_' || activity."id",
    activity."id",
    COALESCE(legacy_user."pointsBalance", 0),
    0,
    0,
    'active',
    activity."createdAt",
    activity."updatedAt"
FROM "ActivityAccount" AS activity
LEFT JOIN "User" AS legacy_user
    ON legacy_user."id" = activity."legacyUserId";

-- Record the migrated opening balance for non-zero legacy balances.
-- This provides immutable provenance without creating zero-value ledger noise.
INSERT INTO "WalletLedgerEntry" (
    "id",
    "walletId",
    "kind",
    "source",
    "deltaSpendable",
    "deltaRedeemable",
    "deltaPending",
    "spendableAfter",
    "redeemableAfter",
    "pendingAfter",
    "idempotencyKey",
    "referenceType",
    "referenceId",
    "metadata",
    "createdAt"
)
SELECT
    'ledger_opening_' || activity."id",
    'wallet_' || activity."id",
    'credit',
    'legacy_balance_migration',
    legacy_user."pointsBalance",
    0,
    0,
    legacy_user."pointsBalance",
    0,
    0,
    'migration:legacy-balance:' || activity."id",
    'User',
    legacy_user."id",
    jsonb_build_object(
        'migration', '20260914050305_add_wallet_ledger_foundation',
        'legacyField', 'User.pointsBalance'
    ),
    CURRENT_TIMESTAMP
FROM "ActivityAccount" AS activity
JOIN "User" AS legacy_user
    ON legacy_user."id" = activity."legacyUserId"
WHERE legacy_user."pointsBalance" <> 0;

