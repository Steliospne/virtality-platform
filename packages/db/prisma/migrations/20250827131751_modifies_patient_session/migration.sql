/*
  Warnings:

  - Added the required column `patientId` to the `PatientSession` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PatientSession" ADD COLUMN     "patientId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "PatientSession" ADD CONSTRAINT "PatientSession_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
