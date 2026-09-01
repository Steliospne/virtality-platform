-- CreateEnum
CREATE TYPE "MarketingBlogPostStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateTable
CREATE TABLE "MarketingBlogAuthor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "image" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingBlogAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingBlogPost" (
    "id" TEXT NOT NULL,
    "status" "MarketingBlogPostStatus" NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "cover" TEXT NOT NULL,
    "coverFocusY" INTEGER,
    "authorId" TEXT NOT NULL,
    "publishedAt" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "body" JSONB NOT NULL,
    "publishedSnapshot" JSONB,
    "slugLocked" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingBlogPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingBlogPost_slug_key" ON "MarketingBlogPost"("slug");

-- CreateIndex
CREATE INDEX "MarketingBlogPost_status_publishedAt_idx" ON "MarketingBlogPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "MarketingBlogPost_status_featured_idx" ON "MarketingBlogPost"("status", "featured");

-- AddForeignKey
ALTER TABLE "MarketingBlogPost" ADD CONSTRAINT "MarketingBlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "MarketingBlogAuthor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed fixed author allowlist
INSERT INTO "MarketingBlogAuthor" ("id", "name", "role", "image", "createdAt", "updatedAt")
VALUES
  ('katerina-tsiraki', 'Katerina Tsiraki', 'CEO & Cognitive Engineer', '/kate_auth_img.jpg', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('virtality-team', 'Virtality', NULL, '/virtality_small_rounded.png', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
