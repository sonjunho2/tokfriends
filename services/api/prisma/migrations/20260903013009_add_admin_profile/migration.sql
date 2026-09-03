-- CreateEnum
CREATE TYPE "AdminTeamRole" AS ENUM ('SUPER_ADMIN', 'MANAGER', 'MODERATOR', 'SUPPORT', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "AdminTeamStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "AdminProfile" (
    "userId" TEXT NOT NULL,
    "role" "AdminTeamRole" NOT NULL DEFAULT 'MANAGER',
    "status" "AdminTeamStatus" NOT NULL DEFAULT 'ACTIVE',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "AdminProfile_role_idx" ON "AdminProfile"("role");

-- CreateIndex
CREATE INDEX "AdminProfile_status_idx" ON "AdminProfile"("status");

-- AddForeignKey
ALTER TABLE "AdminProfile" ADD CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
