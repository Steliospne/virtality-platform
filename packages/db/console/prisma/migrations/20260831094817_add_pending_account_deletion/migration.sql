-- CreateEnum
CREATE TYPE "PendingAccountDeletionStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "PendingAccountDeletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PendingAccountDeletionStatus" NOT NULL DEFAULT 'PENDING',
    "approvalTokenHash" TEXT NOT NULL,
    "initiatingSessionId" TEXT,
    "destinationEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(6),
    "cancelledAt" TIMESTAMP(6),
    "supersededAt" TIMESTAMP(6),

    CONSTRAINT "PendingAccountDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_account_deletion_userId_status_idx" ON "PendingAccountDeletion"("userId", "status");

-- CreateIndex
CREATE INDEX "pending_account_deletion_approvalTokenHash_idx" ON "PendingAccountDeletion"("approvalTokenHash");

-- AddForeignKey
ALTER TABLE "PendingAccountDeletion" ADD CONSTRAINT "pending_account_deletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
