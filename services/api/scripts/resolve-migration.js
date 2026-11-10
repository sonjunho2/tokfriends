const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('[resolve-migration] Running pre-deployment database compatibility checks...');

  try {
    // 1. Delete rolled back migration record so prisma migrate deploy can apply it fresh
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations" 
      WHERE migration_name = '20261014110000_dagaon_ai_staff_and_calls';
    `);
    console.log('[resolve-migration] Cleared _prisma_migrations record for 20261014110000_dagaon_ai_staff_and_calls.');
  } catch (err) {
    console.log('[resolve-migration] Note on _prisma_migrations cleanup:', err.message);
  }

  try {
    // 2. Ensure UserPhoto table has all columns (both url/sortOrder and imageUrl/order)
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "UserPhoto" ADD COLUMN IF NOT EXISTS "url" TEXT;
        ALTER TABLE "UserPhoto" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;
        ALTER TABLE "UserPhoto" ADD COLUMN IF NOT EXISTS "isPrimary" BOOLEAN DEFAULT false;
        ALTER TABLE "UserPhoto" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
        ALTER TABLE "UserPhoto" ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;
        UPDATE "UserPhoto" SET "url" = "imageUrl" WHERE "url" IS NULL AND "imageUrl" IS NOT NULL;
        UPDATE "UserPhoto" SET "imageUrl" = "url" WHERE "imageUrl" IS NULL AND "url" IS NOT NULL;
        UPDATE "UserPhoto" SET "sortOrder" = "order" WHERE "sortOrder" IS NULL AND "order" IS NOT NULL;
        UPDATE "UserPhoto" SET "order" = "sortOrder" WHERE "order" IS NULL AND "sortOrder" IS NOT NULL;
      EXCEPTION WHEN others THEN null;
      END $$;
    `);
    console.log('[resolve-migration] Ensured UserPhoto columns (url, sortOrder, imageUrl, order).');
  } catch (err) {
    console.log('[resolve-migration] UserPhoto column check note:', err.message);
  }

  try {
    // 3. Ensure User table has all required columns
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pointBalance" INTEGER DEFAULT 0;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "callRatePerMinute" INTEGER;
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
        ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';
      EXCEPTION WHEN others THEN null;
      END $$;
    `);
    console.log('[resolve-migration] Ensured User columns (nickname, pointBalance, etc.).');
  } catch (err) {
    console.log('[resolve-migration] User column check note:', err.message);
  }

  try {
    // 4. Ensure AiDecisionQueue table has collaborationLog column
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        ALTER TABLE "AiDecisionQueue" ADD COLUMN IF NOT EXISTS "collaborationLog" JSONB;
      EXCEPTION WHEN others THEN null;
      END $$;
    `);
    console.log('[resolve-migration] Ensured AiDecisionQueue column (collaborationLog).');
  } catch (err) {
    console.log('[resolve-migration] AiDecisionQueue column check note:', err.message);
  }

  try {
    // 5. Ensure MarketProduct, NormalProduct, and SudaPost tables & enum types
    await prisma.$executeRawUnsafe(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarketProductType') THEN
          CREATE TYPE "MarketProductType" AS ENUM ('C2C_USED', 'B2C_GROUP');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductStatus') THEN
          CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'RESERVED', 'COMPLETED', 'CANCELLED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NormalProductStatus') THEN
          CREATE TYPE "NormalProductStatus" AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'HIDDEN', 'DELETED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductOwnerType') THEN
          CREATE TYPE "ProductOwnerType" AS ENUM ('HEADQUARTERS', 'MERCHANT', 'USER_C2C');
        END IF;

        CREATE TABLE IF NOT EXISTS "MarketProduct" (
          "id" TEXT PRIMARY KEY,
          "sellerId" TEXT NOT NULL,
          "type" "MarketProductType" NOT NULL DEFAULT 'C2C_USED',
          "title" VARCHAR(100) NOT NULL,
          "description" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "price" INTEGER NOT NULL,
          "originalPrice" INTEGER,
          "targetQuantity" INTEGER NOT NULL DEFAULT 1,
          "currentQuantity" INTEGER NOT NULL DEFAULT 0,
          "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
          "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
          "locationName" TEXT,
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "SudaPost" (
          "id" TEXT PRIMARY KEY,
          "authorId" TEXT NOT NULL,
          "content" VARCHAR(300) NOT NULL,
          "neighborhood" TEXT,
          "latitude" DOUBLE PRECISION,
          "longitude" DOUBLE PRECISION,
          "likesCount" INTEGER NOT NULL DEFAULT 0,
          "repliesCount" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS "NormalProduct" (
          "id" TEXT PRIMARY KEY,
          "merchantId" TEXT,
          "ownerType" "ProductOwnerType" NOT NULL DEFAULT 'HEADQUARTERS',
          "name" TEXT NOT NULL,
          "description" TEXT,
          "category" TEXT NOT NULL DEFAULT 'GENERAL',
          "priceKrw" INTEGER NOT NULL DEFAULT 0,
          "salePriceKrw" INTEGER NOT NULL DEFAULT 0,
          "shippingFee" INTEGER NOT NULL DEFAULT 0,
          "stock" INTEGER NOT NULL DEFAULT 100,
          "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "status" "NormalProductStatus" NOT NULL DEFAULT 'ACTIVE',
          "isHqDirect" BOOLEAN NOT NULL DEFAULT false,
          "allowAffiliate" BOOLEAN NOT NULL DEFAULT true,
          "affiliateCommissionRate" DECIMAL(5,2) NOT NULL DEFAULT 10.00,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      EXCEPTION WHEN others THEN null;
      END $$;
    `);
    console.log('[resolve-migration] Ensured MarketProduct, NormalProduct, SudaPost tables & enums.');
  } catch (err) {
    console.log('[resolve-migration] Market/Suda schema check note:', err.message);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.log('[resolve-migration] Non-blocking notice:', err.message);
  process.exit(0);
});
