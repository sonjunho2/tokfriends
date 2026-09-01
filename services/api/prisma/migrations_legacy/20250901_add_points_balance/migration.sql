-- Add pointsBalance column to User table with default 0 for existing records
ALTER TABLE "User"
    ADD COLUMN "pointsBalance" INTEGER NOT NULL DEFAULT 0;
