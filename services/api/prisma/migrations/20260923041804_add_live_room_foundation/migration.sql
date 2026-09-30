-- CreateTable
CREATE TABLE "LiveRoom" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "hostAccountId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'talk',
    "status" TEXT NOT NULL DEFAULT 'live',
    "viewerCount" INTEGER NOT NULL DEFAULT 0,
    "totalLikes" INTEGER NOT NULL DEFAULT 0,
    "totalGiftsPoints" INTEGER NOT NULL DEFAULT 0,
    "coverUri" TEXT,
    "streamKey" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "senderAccountId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'chat',
    "content" TEXT NOT NULL,
    "giftPoints" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiveMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveRoom_status_startedAt_idx" ON "LiveRoom"("status", "startedAt");

-- CreateIndex
CREATE INDEX "LiveRoom_hostId_status_idx" ON "LiveRoom"("hostId", "status");

-- CreateIndex
CREATE INDEX "LiveMessage_roomId_createdAt_idx" ON "LiveMessage"("roomId", "createdAt");

-- AddForeignKey
ALTER TABLE "LiveRoom" ADD CONSTRAINT "LiveRoom_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveRoom" ADD CONSTRAINT "LiveRoom_hostAccountId_fkey" FOREIGN KEY ("hostAccountId") REFERENCES "ActivityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMessage" ADD CONSTRAINT "LiveMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "LiveRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMessage" ADD CONSTRAINT "LiveMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveMessage" ADD CONSTRAINT "LiveMessage_senderAccountId_fkey" FOREIGN KEY ("senderAccountId") REFERENCES "ActivityAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
