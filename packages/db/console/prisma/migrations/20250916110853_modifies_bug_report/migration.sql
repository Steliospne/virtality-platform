/*
  Warnings:

  - You are about to drop the column `completedAt` on the `BugReport` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BugReport" DROP COLUMN "completedAt",
ADD COLUMN     "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
