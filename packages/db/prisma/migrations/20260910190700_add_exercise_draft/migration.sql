-- CreateEnum
CREATE TYPE "ExerciseDraftLaterality" AS ENUM ('pair', 'single');

-- CreateTable
CREATE TABLE "ExerciseDraft" (
    "id" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "laterality" "ExerciseDraftLaterality",
    "displayName" TEXT NOT NULL DEFAULT '',
    "unityStem" TEXT NOT NULL DEFAULT '',
    "unityStemDirty" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "item" TEXT,
    "image" TEXT,
    "video" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "ExerciseDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseDraft_createdBy_idx" ON "ExerciseDraft"("createdBy");
