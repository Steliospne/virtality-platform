/*
  Warnings:

  - The primary key for the `SessionData` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "SessionData" DROP CONSTRAINT "SessionData_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SessionData_pkey" PRIMARY KEY ("id");
