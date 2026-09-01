CREATE TYPE "PendingPromotionCodeStatus" AS ENUM (
    'open',
    'applied',
    'canceled',
    'failed',
    'expired'
);

CREATE TABLE "PendingPromotionCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "promotionCodeId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "status" "PendingPromotionCodeStatus" NOT NULL DEFAULT 'open',
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PendingPromotionCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PendingPromotionCode_userId_status_expiresAt_idx"
ON "PendingPromotionCode"("userId", "status", "expiresAt");

CREATE UNIQUE INDEX "PendingPromotionCode_one_open_per_user_idx"
ON "PendingPromotionCode"("userId")
WHERE "status" = 'open';

ALTER TABLE "PendingPromotionCode"
ADD CONSTRAINT "PendingPromotionCode_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
