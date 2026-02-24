/*
  Warnings:

  - You are about to drop the `TesterCode` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TesterCode" DROP CONSTRAINT "TesterCode_usedBy_fkey";

-- DropTable
DROP TABLE "TesterCode";

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "usedAt" TIMESTAMP(6),
    "usedBy" TEXT,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_code_key" ON "ReferralCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_usedBy_key" ON "ReferralCode"("usedBy");

-- AddForeignKey
ALTER TABLE "ReferralCode" ADD CONSTRAINT "ReferralCode_usedBy_fkey" FOREIGN KEY ("usedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
