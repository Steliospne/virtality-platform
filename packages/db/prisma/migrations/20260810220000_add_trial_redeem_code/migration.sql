-- CreateEnum
CREATE TYPE "TrialRedeemCodeStatus" AS ENUM ('unused', 'redeemed', 'already_entitled');

-- CreateTable
CREATE TABLE "TrialRedeemCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "status" "TrialRedeemCodeStatus" NOT NULL DEFAULT 'unused',
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "note" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL,
    "usedAt" TIMESTAMP(6),
    "usedBy" TEXT,

    CONSTRAINT "TrialRedeemCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrialRedeemCode_code_key" ON "TrialRedeemCode"("code");

-- AddForeignKey
ALTER TABLE "TrialRedeemCode" ADD CONSTRAINT "TrialRedeemCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
