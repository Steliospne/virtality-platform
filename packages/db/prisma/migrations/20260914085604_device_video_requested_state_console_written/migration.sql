-- AlterEnum
ALTER TYPE "DeviceVideoStatus" ADD VALUE 'requested';

-- AlterTable
ALTER TABLE "DeviceVideoReport" ALTER COLUMN "freeBytes" DROP NOT NULL;
