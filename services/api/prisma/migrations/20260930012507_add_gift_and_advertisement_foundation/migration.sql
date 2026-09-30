-- CreateTable
CREATE TABLE "Gift" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "pricePoints" INTEGER NOT NULL,
    "thumbnailUrl" TEXT,
    "animationUrl" TEXT,
    "animationType" TEXT NOT NULL DEFAULT 'alpha_video',
    "category" TEXT NOT NULL DEFAULT 'general',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "liveEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GiftTransaction" (
    "id" TEXT NOT NULL,
    "giftId" TEXT NOT NULL,
    "senderAccountId" TEXT NOT NULL,
    "recipientAccountId" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "chatId" TEXT,
    "liveRoomId" TEXT,
    "points" INTEGER NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GiftTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT NOT NULL,
    "targetUrl" TEXT,
    "placement" TEXT NOT NULL DEFAULT 'HOME_BANNER',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "rewardPoints" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "impressionCount" INTEGER NOT NULL DEFAULT 0,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Gift_code_key" ON "Gift"("code");

-- CreateIndex
CREATE INDEX "Gift_isActive_sortOrder_idx" ON "Gift"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Gift_category_isActive_idx" ON "Gift"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "GiftTransaction_idempotencyKey_key" ON "GiftTransaction"("idempotencyKey");

-- CreateIndex
CREATE INDEX "GiftTransaction_senderAccountId_createdAt_idx" ON "GiftTransaction"("senderAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "GiftTransaction_recipientAccountId_createdAt_idx" ON "GiftTransaction"("recipientAccountId", "createdAt");

-- CreateIndex
CREATE INDEX "GiftTransaction_contextType_liveRoomId_idx" ON "GiftTransaction"("contextType", "liveRoomId");

-- CreateIndex
CREATE INDEX "GiftTransaction_contextType_chatId_idx" ON "GiftTransaction"("contextType", "chatId");

-- CreateIndex
CREATE INDEX "Advertisement_placement_isActive_priority_idx" ON "Advertisement"("placement", "isActive", "priority");

-- CreateIndex
CREATE INDEX "Advertisement_isActive_startsAt_endsAt_idx" ON "Advertisement"("isActive", "startsAt", "endsAt");

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_giftId_fkey" FOREIGN KEY ("giftId") REFERENCES "Gift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "ActivityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GiftTransaction" ADD CONSTRAINT "GiftTransaction_recipientAccountId_fkey" FOREIGN KEY ("recipientAccountId") REFERENCES "ActivityAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
