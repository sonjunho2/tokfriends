-- CreateTable
CREATE TABLE "LegalDocument" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "LegalDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentSlug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "updatedBy" TEXT,
    "memo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_documentSlug_version_key"
ON "LegalDocumentVersion"("documentSlug", "version");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_documentSlug_createdAt_idx"
ON "LegalDocumentVersion"("documentSlug", "createdAt");

-- AddForeignKey
ALTER TABLE "LegalDocumentVersion"
ADD CONSTRAINT "LegalDocumentVersion_documentSlug_fkey"
FOREIGN KEY ("documentSlug")
REFERENCES "LegalDocument"("slug")
ON DELETE CASCADE
ON UPDATE CASCADE;