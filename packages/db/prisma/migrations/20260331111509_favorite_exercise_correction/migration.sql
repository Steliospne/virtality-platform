/*
  Warnings:

  - A unique constraint covering the columns `[exerciseId,userId]` on the table `FavoriteExercise` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "FavoriteExercise_exerciseId_userId_key" ON "FavoriteExercise"("exerciseId", "userId");
