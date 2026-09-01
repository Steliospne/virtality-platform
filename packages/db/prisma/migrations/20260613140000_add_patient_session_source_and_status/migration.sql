-- CreateEnum
CREATE TYPE "PatientSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'INTERRUPTED');

-- AlterTable
ALTER TABLE "PatientSession" ADD COLUMN "status" "PatientSessionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "PatientSession" ADD COLUMN "sourceReusableProgramId" TEXT;
ALTER TABLE "PatientSession" ADD COLUMN "sourceProgramName" TEXT;

-- Backfill completed sessions
UPDATE "PatientSession" SET "status" = 'COMPLETED' WHERE "completedAt" IS NOT NULL;

-- AlterTable
ALTER TABLE "SessionExercise" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_sourceReusableProgramId_fkey" FOREIGN KEY ("sourceReusableProgramId") REFERENCES "ReusableProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
