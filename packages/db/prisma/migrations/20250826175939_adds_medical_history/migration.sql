/*
  Warnings:

  - You are about to drop the column `history` on the `Patient` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Patient" DROP COLUMN "history";

-- AlterTable
ALTER TABLE "SessionData" ADD COLUMN     "nprs" TEXT,
ADD COLUMN     "otherTherapies" JSONB;

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "anamneses" TEXT,
    "complaints" TEXT,
    "expectations" TEXT,
    "diagnosis" TEXT,
    "nprs" TEXT,
    "bodyFront" JSONB,
    "bodyBack" JSONB,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
