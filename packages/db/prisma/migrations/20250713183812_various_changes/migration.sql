/*
  Warnings:

  - You are about to drop the column `avatarId` on the `Patient` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "devices_userId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "invitation_inviterId_fkey";

-- DropForeignKey
ALTER TABLE "Invitation" DROP CONSTRAINT "invitation_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Member" DROP CONSTRAINT "member_userId_fkey";

-- DropForeignKey
ALTER TABLE "Patient" DROP CONSTRAINT "Patient_avatarId_fkey";

-- DropForeignKey
ALTER TABLE "PatientProgram" DROP CONSTRAINT "PatientProgram_userId_fkey";

-- DropForeignKey
ALTER TABLE "PatientSession" DROP CONSTRAINT "PatientSession_programId_fkey";

-- DropForeignKey
ALTER TABLE "ProgramExercise" DROP CONSTRAINT "program_exercises_programId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "SessionData" DROP CONSTRAINT "SessionData_sessionExerciseId_fkey";

-- DropForeignKey
ALTER TABLE "SessionExercise" DROP CONSTRAINT "SessionExercise_patientSessionId_fkey";

-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "avatarId",
ADD COLUMN     "deletedAt" TIMESTAMP(6),
ADD COLUMN     "history" TEXT;

-- AlterTable
ALTER TABLE "PatientSession" ALTER COLUMN "programId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SessionData" ALTER COLUMN "sessionExerciseId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SessionExercise" ALTER COLUMN "patientSessionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(6);

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "devices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "invitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientProgram" ADD CONSTRAINT "PatientProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramExercise" ADD CONSTRAINT "program_exercises_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PatientProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "PatientProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionExercise" ADD CONSTRAINT "SessionExercise_patientSessionId_fkey" FOREIGN KEY ("patientSessionId") REFERENCES "PatientSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionData" ADD CONSTRAINT "SessionData_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "SessionExercise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
