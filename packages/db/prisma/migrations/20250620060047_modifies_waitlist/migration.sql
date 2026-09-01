/*
  Warnings:

  - You are about to drop the column `fullName` on the `WaitingList` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `WaitingList` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WaitingList" DROP COLUMN "fullName",
DROP COLUMN "specialty",
ADD COLUMN     "plan" TEXT;
