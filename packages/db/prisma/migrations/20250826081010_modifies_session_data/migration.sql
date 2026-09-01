-- AlterTable
ALTER TABLE "SessionData" ADD COLUMN     "patientSessionId" TEXT;

-- AddForeignKey
ALTER TABLE "SessionData" ADD CONSTRAINT "SessionData_patientSessionId_fkey" FOREIGN KEY ("patientSessionId") REFERENCES "PatientSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
