-- CreateTable
CREATE TABLE "RenewPromptDelivery" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "RenewTriggerChannel" NOT NULL,
    "daysBefore" INTEGER NOT NULL,
    "epochKey" TEXT NOT NULL,
    "deliveredAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "RenewPromptDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RenewPromptDelivery_userId_epochKey_idx" ON "RenewPromptDelivery"("userId", "epochKey");

-- CreateIndex
CREATE INDEX "RenewPromptDelivery_userId_channel_epochKey_idx" ON "RenewPromptDelivery"("userId", "channel", "epochKey");

-- CreateIndex
CREATE UNIQUE INDEX "RenewPromptDelivery_userId_channel_daysBefore_epochKey_key" ON "RenewPromptDelivery"("userId", "channel", "daysBefore", "epochKey");

-- AddForeignKey
ALTER TABLE "RenewPromptDelivery" ADD CONSTRAINT "RenewPromptDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
