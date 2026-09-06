-- Rename `TrialGrant` to `AccessGrant` to match the Access Gate domain
-- vocabulary already used everywhere else (see docs/adr/0007, docs/adr/0008).
-- Pure renames, no data loss.

ALTER TABLE "TrialGrant" RENAME TO "AccessGrant";
ALTER TABLE "AccessGrant" RENAME CONSTRAINT "TrialGrant_pkey" TO "AccessGrant_pkey";
ALTER TABLE "AccessGrant" RENAME CONSTRAINT "TrialGrant_userId_fkey" TO "AccessGrant_userId_fkey";
ALTER INDEX "TrialGrant_userId_status_idx" RENAME TO "AccessGrant_userId_status_idx";
ALTER INDEX "TrialGrant_one_open_per_user_idx" RENAME TO "AccessGrant_one_open_per_user_idx";

ALTER TYPE "TrialGrantStatus" RENAME TO "AccessGrantStatus";
