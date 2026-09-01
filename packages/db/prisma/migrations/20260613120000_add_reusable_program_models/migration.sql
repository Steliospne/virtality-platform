-- CreateEnum
CREATE TYPE "ReusableProgramKind" AS ENUM ('CLINICIAN_OWNED', 'STARTER_TEMPLATE');

-- CreateTable
CREATE TABLE "ReusableProgram" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "ReusableProgramKind" NOT NULL DEFAULT 'CLINICIAN_OWNED',
    "userId" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retiredAt" TIMESTAMP(6),

    CONSTRAINT "ReusableProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReusableProgramExercise" (
    "id" TEXT NOT NULL,
    "reusableProgramId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sets" INTEGER NOT NULL DEFAULT 3,
    "reps" INTEGER NOT NULL DEFAULT 10,
    "restTime" INTEGER NOT NULL DEFAULT 5,
    "holdTime" INTEGER NOT NULL DEFAULT 1,
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1,

    CONSTRAINT "ReusableProgramExercise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReusableProgram_userId_kind_retiredAt_idx" ON "ReusableProgram"("userId", "kind", "retiredAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReusableProgramExercise_reusableProgramId_position_key" ON "ReusableProgramExercise"("reusableProgramId", "position");

-- AddForeignKey
ALTER TABLE "ReusableProgram" ADD CONSTRAINT "ReusableProgram_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReusableProgramExercise" ADD CONSTRAINT "ReusableProgramExercise_reusableProgramId_fkey" FOREIGN KEY ("reusableProgramId") REFERENCES "ReusableProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReusableProgramExercise" ADD CONSTRAINT "ReusableProgramExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
