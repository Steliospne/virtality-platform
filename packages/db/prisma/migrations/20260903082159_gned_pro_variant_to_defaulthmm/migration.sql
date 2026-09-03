/*
  Warnings:

  - You are about to drop the column `assignedProVariant` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "assignedProVariant",
ADD COLUMN     "assignedDefaultVariant" TEXT;
