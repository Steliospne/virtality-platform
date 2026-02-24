-- CreateEnum
CREATE TYPE "Language" AS ENUM ('Greek', 'English');

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "language" "Language" NOT NULL DEFAULT 'Greek';
