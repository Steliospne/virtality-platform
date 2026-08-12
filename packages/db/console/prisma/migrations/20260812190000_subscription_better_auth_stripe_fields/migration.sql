-- Align Subscription with Better Auth Stripe fields used by /subscription/success.
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "cancelAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "billingInterval" TEXT;
ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "stripeScheduleId" TEXT;
