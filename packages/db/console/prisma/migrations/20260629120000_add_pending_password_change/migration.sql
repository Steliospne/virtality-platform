-- CreateEnum
CREATE TYPE "PendingPasswordChangeKind" AS ENUM ('SETUP', 'CHANGE');

-- CreateEnum
CREATE TYPE "PendingPasswordChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'CANCELLED', 'SUPERSEDED');

-- CreateTable
CREATE TABLE "PendingPasswordChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "PendingPasswordChangeKind" NOT NULL,
    "status" "PendingPasswordChangeStatus" NOT NULL DEFAULT 'PENDING',
    "pendingPasswordHash" TEXT NOT NULL,
    "approvalTokenHash" TEXT NOT NULL,
    "initiatingSessionId" TEXT,
    "destinationEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(6),
    "cancelledAt" TIMESTAMP(6),
    "supersededAt" TIMESTAMP(6),

    CONSTRAINT "PendingPasswordChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pending_password_change_userId_status_idx" ON "PendingPasswordChange"("userId", "status");

-- CreateIndex
CREATE INDEX "pending_password_change_approvalTokenHash_idx" ON "PendingPasswordChange"("approvalTokenHash");

-- AddForeignKey
ALTER TABLE "PendingPasswordChange" ADD CONSTRAINT "pending_password_change_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
