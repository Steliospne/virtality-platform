/*
  Warnings:

  - You are about to drop the column `otherTherapies` on the `PatientSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientSession" DROP COLUMN "otherTherapies";

-- CreateTable
CREATE TABLE "SupplementalTherapy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SupplementalTherapy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSessionSupplementalTherapyRel" (
    "id" TEXT NOT NULL,
    "supplementalTherapyId" TEXT,
    "patientSessionId" TEXT,

    CONSTRAINT "PatientSessionSupplementalTherapyRel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PatientSessionSupplementalTherapyRel" ADD CONSTRAINT "PatientSessionSupplementalTherapyRel_patientSessionId_fkey" FOREIGN KEY ("patientSessionId") REFERENCES "PatientSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSessionSupplementalTherapyRel" ADD CONSTRAINT "PatientSessionSupplementalTherapyRel_supplementalTherapyId_fkey" FOREIGN KEY ("supplementalTherapyId") REFERENCES "SupplementalTherapy"("id") ON DELETE SET NULL ON UPDATE CASCADE;
