/*
  Warnings:

  - You are about to drop the column `nprs` on the `SessionData` table. All the data in the column will be lost.
  - You are about to drop the column `otherTherapies` on the `SessionData` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PatientSession" ADD COLUMN     "nprs" TEXT,
ADD COLUMN     "otherTherapies" JSONB;

-- AlterTable
ALTER TABLE "SessionData" DROP COLUMN "nprs",
DROP COLUMN "otherTherapies";
