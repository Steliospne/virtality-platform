-- TrialGrant is issued directly `active` now (no `pending` step). Backfill
-- any pre-existing pending rows to `revoked` before the value is removed.
UPDATE "TrialGrant" SET "status" = 'revoked' WHERE "status" = 'pending';

-- Drop the partial unique index before swapping the enum type; it will be
-- recreated below scoped to `active` only.
DROP INDEX "TrialGrant_one_open_per_user_idx";

-- Postgres cannot drop an enum value in place; recreate the type without it.
CREATE TYPE "TrialGrantStatus_new" AS ENUM ('active', 'converted', 'revoked');
ALTER TABLE "TrialGrant" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "TrialGrant" ALTER COLUMN "status" TYPE "TrialGrantStatus_new" USING ("status"::text::"TrialGrantStatus_new");
DROP TYPE "TrialGrantStatus";
ALTER TYPE "TrialGrantStatus_new" RENAME TO "TrialGrantStatus";
ALTER TABLE "TrialGrant" ALTER COLUMN "status" SET DEFAULT 'active';

-- Recreate the at-most-one-open-grant-per-user constraint for the new statuses.
CREATE UNIQUE INDEX "TrialGrant_one_open_per_user_idx"
ON "TrialGrant"("userId")
WHERE "status" = 'active';
