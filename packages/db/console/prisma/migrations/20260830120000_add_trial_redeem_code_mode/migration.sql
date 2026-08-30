-- CreateEnum
CREATE TYPE "TrialRedeemCodeMode" AS ENUM ('permanent_free', 'timed_trial');

-- AlterTable
ALTER TABLE "TrialRedeemCode" ADD COLUMN "mode" "TrialRedeemCodeMode" NOT NULL DEFAULT 'timed_trial';
