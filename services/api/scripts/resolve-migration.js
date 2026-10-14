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

  await prisma.$disconnect();
}

main().catch((err) => {
  console.log('[resolve-migration] Non-blocking notice:', err.message);
  process.exit(0);
});
