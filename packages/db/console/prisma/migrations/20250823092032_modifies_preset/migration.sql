/*
  Warnings:

  - You are about to drop the column `name` on the `Preset` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Preset" DROP COLUMN "name",
ADD COLUMN     "presetName" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "start" SET DATA TYPE TEXT,
ALTER COLUMN "end" SET DATA TYPE TEXT;
