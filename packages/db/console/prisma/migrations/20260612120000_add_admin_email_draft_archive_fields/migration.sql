-- AlterTable
ALTER TABLE "AdminEmailDraft" ADD COLUMN "archivedAt" TIMESTAMP(6),
ADD COLUMN "archivedById" TEXT,
ADD COLUMN "restoredAt" TIMESTAMP(6),
ADD COLUMN "restoredById" TEXT;

-- CreateIndex
CREATE INDEX "AdminEmailDraft_archivedAt_idx" ON "AdminEmailDraft"("archivedAt");

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
