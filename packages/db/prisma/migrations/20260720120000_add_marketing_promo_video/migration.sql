-- CreateTable
CREATE TABLE "MarketingPromoVideo" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "MarketingPromoVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingPromoVideo_objectKey_key" ON "MarketingPromoVideo"("objectKey");

-- Seed the current landing promo so the section stays visible after cutover.
INSERT INTO "MarketingPromoVideo" ("id", "objectKey", "createdAt", "updatedAt")
VALUES (
    'promo-video-singleton',
    'virtality-promo-web-001.mp4',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
