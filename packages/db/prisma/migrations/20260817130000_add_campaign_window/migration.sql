-- CreateTable
CREATE TABLE "CampaignWindow" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(6) NOT NULL,
    "endsAt" TIMESTAMP(6) NOT NULL,
    "closedAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "CampaignWindow_pkey" PRIMARY KEY ("id")
);
