-- CreateEnum
CREATE TYPE "MosaicMediaKind" AS ENUM ('image', 'video');

-- CreateTable
CREATE TABLE "MarketingLandingMosaic" (
    "id" TEXT NOT NULL DEFAULT 'landing',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingLandingMosaic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingMosaicTile" (
    "id" TEXT NOT NULL,
    "mosaicId" TEXT NOT NULL DEFAULT 'landing',
    "objectKey" TEXT NOT NULL,
    "mediaKind" "MosaicMediaKind" NOT NULL,
    "alt" TEXT NOT NULL,
    "row" INTEGER NOT NULL,
    "col" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingMosaicTile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MarketingMosaicTile_mosaicId_idx" ON "MarketingMosaicTile"("mosaicId");

-- AddForeignKey
ALTER TABLE "MarketingMosaicTile" ADD CONSTRAINT "MarketingMosaicTile_mosaicId_fkey" FOREIGN KEY ("mosaicId") REFERENCES "MarketingLandingMosaic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
