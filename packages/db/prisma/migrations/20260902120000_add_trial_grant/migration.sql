-- CreateEnum
CREATE TYPE "TrialGrantStatus" AS ENUM ('pending', 'active', 'converted', 'revoked');

-- CreateTable
CREATE TABLE "TrialGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "trialStart" TIMESTAMP(6),
    "trialEnd" TIMESTAMP(6),
    "status" "TrialGrantStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(6) NOT NULL,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "TrialGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrialGrant_userId_status_idx" ON "TrialGrant"("userId", "status");

CREATE UNIQUE INDEX "TrialGrant_one_open_per_user_idx"
ON "TrialGrant"("userId")
WHERE "status" IN ('pending', 'active');

-- AddForeignKey
ALTER TABLE "TrialGrant" ADD CONSTRAINT "TrialGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
