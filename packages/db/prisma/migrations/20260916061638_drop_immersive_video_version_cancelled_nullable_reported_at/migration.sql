/*
  Warnings:

  - The values [cancelled] on the enum `DeviceVideoFailureReason` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `version` on the `DeviceVideo` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `ImmersiveVideo` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceVideoFailureReason_new" AS ENUM ('insufficient_storage', 'network', 'checksum_mismatch', 'url_expired', 'unavailable');
ALTER TABLE "DeviceVideo" ALTER COLUMN "reason" TYPE "DeviceVideoFailureReason_new" USING ("reason"::text::"DeviceVideoFailureReason_new");
ALTER TYPE "DeviceVideoFailureReason" RENAME TO "DeviceVideoFailureReason_old";
ALTER TYPE "DeviceVideoFailureReason_new" RENAME TO "DeviceVideoFailureReason";
DROP TYPE "public"."DeviceVideoFailureReason_old";
COMMIT;

-- DropIndex
DROP INDEX "DeviceVideo_videoId_version_idx";

-- AlterTable
ALTER TABLE "DeviceVideo" DROP COLUMN "version";

-- AlterTable
ALTER TABLE "DeviceVideoReport" ALTER COLUMN "reportedAt" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ImmersiveVideo" DROP COLUMN "version";

-- CreateIndex
CREATE INDEX "DeviceVideo_videoId_idx" ON "DeviceVideo"("videoId");
