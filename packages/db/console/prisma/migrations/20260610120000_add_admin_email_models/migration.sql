-- CreateEnum
CREATE TYPE "AdminEmailDeliveryStatus" AS ENUM ('sent', 'failed');

-- CreateTable
CREATE TABLE "AdminEmailDraft" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL DEFAULT '',
    "previewText" TEXT,
    "bodyBlocksJson" TEXT NOT NULL DEFAULT '[]',
    "recipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hasSuccessfulTestSend" BOOLEAN NOT NULL DEFAULT false,
    "lastTestSentAt" TIMESTAMP(6),
    "createdById" TEXT NOT NULL,
    "clonedFromDraftId" TEXT,
    "clonedFromSentRecordId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "AdminEmailDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEmailSentRecord" (
    "id" TEXT NOT NULL,
    "sourceDraftId" TEXT,
    "subject" TEXT NOT NULL,
    "previewText" TEXT,
    "bodyBlocksJson" TEXT NOT NULL,
    "renderedSnapshotJson" TEXT NOT NULL,
    "recipients" TEXT[] NOT NULL,
    "createdById" TEXT NOT NULL,
    "sentById" TEXT NOT NULL,
    "draftCreatedAt" TIMESTAMP(6) NOT NULL,
    "sentAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEmailSentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminEmailDeliveryResult" (
    "id" TEXT NOT NULL,
    "sentRecordId" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "status" "AdminEmailDeliveryStatus" NOT NULL,
    "errorMessage" TEXT,
    "attemptedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminEmailDeliveryResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminEmailDraft_createdById_idx" ON "AdminEmailDraft"("createdById");

-- CreateIndex
CREATE INDEX "AdminEmailDraft_updatedAt_idx" ON "AdminEmailDraft"("updatedAt");

-- CreateIndex
CREATE INDEX "AdminEmailSentRecord_sentAt_idx" ON "AdminEmailSentRecord"("sentAt");

-- CreateIndex
CREATE INDEX "AdminEmailSentRecord_createdById_idx" ON "AdminEmailSentRecord"("createdById");

-- CreateIndex
CREATE INDEX "AdminEmailSentRecord_sentById_idx" ON "AdminEmailSentRecord"("sentById");

-- CreateIndex
CREATE INDEX "AdminEmailDeliveryResult_sentRecordId_idx" ON "AdminEmailDeliveryResult"("sentRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "AdminEmailDeliveryResult_sentRecordId_recipientEmail_key" ON "AdminEmailDeliveryResult"("sentRecordId", "recipientEmail");

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_clonedFromDraftId_fkey" FOREIGN KEY ("clonedFromDraftId") REFERENCES "AdminEmailDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailSentRecord" ADD CONSTRAINT "AdminEmailSentRecord_sourceDraftId_fkey" FOREIGN KEY ("sourceDraftId") REFERENCES "AdminEmailDraft"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_clonedFromSentRecordId_fkey" FOREIGN KEY ("clonedFromSentRecordId") REFERENCES "AdminEmailSentRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailSentRecord" ADD CONSTRAINT "AdminEmailSentRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailSentRecord" ADD CONSTRAINT "AdminEmailSentRecord_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailDeliveryResult" ADD CONSTRAINT "AdminEmailDeliveryResult_sentRecordId_fkey" FOREIGN KEY ("sentRecordId") REFERENCES "AdminEmailSentRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
