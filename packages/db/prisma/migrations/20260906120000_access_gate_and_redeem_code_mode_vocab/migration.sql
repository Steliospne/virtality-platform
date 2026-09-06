-- Access Gate statuses replace TrialGrant `active` with `granted` (permanent) and
-- `trialing` (timed). Permanent vs Timed is also readable from `trialEnd` nullity.

DROP INDEX "TrialGrant_one_open_per_user_idx";

CREATE TYPE "TrialGrantStatus_new" AS ENUM ('granted', 'trialing', 'converted', 'revoked');
ALTER TABLE "TrialGrant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TrialGrant" ALTER COLUMN "status" TYPE "TrialGrantStatus_new" USING (
  CASE
    WHEN "status"::text = 'active' AND "trialEnd" IS NULL THEN 'granted'
    WHEN "status"::text = 'active' THEN 'trialing'
    WHEN "status"::text = 'converted' THEN 'converted'
    WHEN "status"::text = 'revoked' THEN 'revoked'
    ELSE 'revoked'
  END::"TrialGrantStatus_new"
);
DROP TYPE "TrialGrantStatus";
ALTER TYPE "TrialGrantStatus_new" RENAME TO "TrialGrantStatus";
ALTER TABLE "TrialGrant" ALTER COLUMN "status" SET DEFAULT 'trialing';

CREATE UNIQUE INDEX "TrialGrant_one_open_per_user_idx"
ON "TrialGrant"("userId")
WHERE "status" IN ('granted', 'trialing');

-- Access Code redemption modes rename to match the Access Gate vocabulary:
-- `permanent_free` -> `free_grant`, `timed_trial` -> `trial_grant`.

CREATE TYPE "TrialRedeemCodeMode_new" AS ENUM ('free_grant', 'trial_grant');
ALTER TABLE "TrialRedeemCode" ALTER COLUMN "mode" DROP DEFAULT;
ALTER TABLE "TrialRedeemCode" ALTER COLUMN "mode" TYPE "TrialRedeemCodeMode_new" USING (
  CASE
    WHEN "mode"::text = 'permanent_free' THEN 'free_grant'
    WHEN "mode"::text = 'timed_trial' THEN 'trial_grant'
  END::"TrialRedeemCodeMode_new"
);
DROP TYPE "TrialRedeemCodeMode";
ALTER TYPE "TrialRedeemCodeMode_new" RENAME TO "TrialRedeemCodeMode";
ALTER TABLE "TrialRedeemCode" ALTER COLUMN "mode" SET DEFAULT 'trial_grant';
