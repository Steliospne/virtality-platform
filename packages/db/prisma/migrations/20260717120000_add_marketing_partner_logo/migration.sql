-- CreateEnum
CREATE TYPE "PartnerLogoCategory" AS ENUM ('strategic', 'clinical');

-- CreateTable
CREATE TABLE "MarketingPartnerLogo" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "category" "PartnerLogoCategory" NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingPartnerLogo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPartnerLogo_objectKey_key" ON "MarketingPartnerLogo"("objectKey");

-- CreateIndex
CREATE INDEX "MarketingPartnerLogo_category_sortOrder_idx" ON "MarketingPartnerLogo"("category", "sortOrder");
