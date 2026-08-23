-- CreateTable
CREATE TABLE "AdminCustomerAudit" (
    "id" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "stripeOperationId" TEXT,
    "beforeBillingState" JSONB,
    "afterBillingState" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "AdminCustomerAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminCustomerAudit_targetUserId_createdAt_idx" ON "AdminCustomerAudit"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AdminCustomerAudit" ADD CONSTRAINT "AdminCustomerAudit_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminCustomerAudit" ADD CONSTRAINT "AdminCustomerAudit_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
