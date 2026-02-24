-- AlterTable
ALTER TABLE "Preset" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "PresetExercise" ADD COLUMN     "optional" BOOLEAN NOT NULL DEFAULT false;
