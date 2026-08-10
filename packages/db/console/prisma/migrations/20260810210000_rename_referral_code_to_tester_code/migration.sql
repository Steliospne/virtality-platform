-- Rename ReferralCode → TesterCode (preserve rows; drop unused legacy 6-char codes)
ALTER TABLE "ReferralCode" RENAME TO "TesterCode";

ALTER INDEX "ReferralCode_pkey" RENAME TO "TesterCode_pkey";
ALTER INDEX "ReferralCode_code_key" RENAME TO "TesterCode_code_key";
ALTER INDEX "ReferralCode_usedBy_key" RENAME TO "TesterCode_usedBy_key";

ALTER TABLE "TesterCode" RENAME CONSTRAINT "ReferralCode_usedBy_fkey" TO "TesterCode_usedBy_fkey";

-- No legacy 6-char Referral support (#31 / #36): unused non TE-+10 rows are not redeemable
DELETE FROM "TesterCode"
WHERE "usedAt" IS NULL
  AND "code" !~ '^TE-[A-Z0-9]{10}$';
