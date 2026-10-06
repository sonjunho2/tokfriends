-- CreateEnum
CREATE TYPE "StreamerTier" AS ENUM ('ROOKIE', 'BEST', 'PARTNER');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "streamerTier" "StreamerTier" NOT NULL DEFAULT 'ROOKIE';
ALTER TABLE "User" ADD COLUMN "customExchangeRate" INTEGER;
ALTER TABLE "User" ADD COLUMN "contractMemo" TEXT;

-- AlterTable
ALTER TABLE "SettlementRequest" ADD COLUMN "exchangeRate" INTEGER NOT NULL DEFAULT 60;
ALTER TABLE "SettlementRequest" ADD COLUMN "tier" "StreamerTier" NOT NULL DEFAULT 'ROOKIE';
ALTER TABLE "SettlementRequest" ADD COLUMN "platformFeeKrw" INTEGER NOT NULL DEFAULT 0;
