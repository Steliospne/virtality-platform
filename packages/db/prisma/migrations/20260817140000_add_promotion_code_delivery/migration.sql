-- CreateEnum
CREATE TYPE "PromotionCodeDeliveryStatus" AS ENUM ('open');

-- CreateTable
CREATE TABLE "PromotionCodeDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionCodeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "status" "PromotionCodeDeliveryStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PromotionCodeDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PromotionCodeDelivery_userId_status_idx" ON "PromotionCodeDelivery"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PromotionCodeDelivery_userId_promotionCodeId_key" ON "PromotionCodeDelivery"("userId", "promotionCodeId");

-- AddForeignKey
ALTER TABLE "PromotionCodeDelivery" ADD CONSTRAINT "PromotionCodeDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
