-- CreateEnum
CREATE TYPE "AdminEmailTopic" AS ENUM ('product_updates', 'newsletter', 'promotions');

-- CreateEnum
CREATE TYPE "EmailOptOutSource" AS ENUM ('recipient_link', 'admin');

-- AlterTable
ALTER TABLE "AdminEmailDraft" ADD COLUMN     "audienceId" TEXT,
ADD COLUMN     "topic" "AdminEmailTopic" NOT NULL DEFAULT 'product_updates';

-- AlterTable
ALTER TABLE "AdminEmailSentRecord" ADD COLUMN     "audienceId" TEXT,
ADD COLUMN     "audienceName" TEXT,
ADD COLUMN     "suppressedRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "topic" "AdminEmailTopic" NOT NULL DEFAULT 'product_updates';

-- CreateTable
CREATE TABLE "EmailAudience" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleJson" TEXT NOT NULL DEFAULT '{}',
    "includeEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "excludeEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "EmailAudience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailOptOut" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "topic" "AdminEmailTopic",
    "source" "EmailOptOutSource" NOT NULL,
    "note" TEXT,
    "recordedById" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailOptOut_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailAudience_updatedAt_idx" ON "EmailAudience"("updatedAt");

-- CreateIndex
CREATE INDEX "EmailOptOut_email_idx" ON "EmailOptOut"("email");

-- CreateIndex
CREATE INDEX "AdminEmailDraft_audienceId_idx" ON "AdminEmailDraft"("audienceId");

-- AddForeignKey
ALTER TABLE "EmailAudience" ADD CONSTRAINT "EmailAudience_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailOptOut" ADD CONSTRAINT "EmailOptOut_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminEmailDraft" ADD CONSTRAINT "AdminEmailDraft_audienceId_fkey" FOREIGN KEY ("audienceId") REFERENCES "EmailAudience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
