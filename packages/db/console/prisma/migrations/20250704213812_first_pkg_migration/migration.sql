/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Avatar` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Map` table. All the data in the column will be lost.
  - The primary key for the `Patient` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `imageUrl` on the `Patient` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[image]` on the table `Avatar` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[image]` on the table `Exercise` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[image]` on the table `Map` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[image]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[image]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdAt` to the `WaitingList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Avatar" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Map" DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Patient" 
DROP COLUMN "imageUrl",
ADD COLUMN     "image" TEXT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ALTER COLUMN "email" SET DATA TYPE TEXT,
ALTER COLUMN "phone" SET DATA TYPE TEXT,
ALTER COLUMN "dob" SET DATA TYPE TEXT,
ALTER COLUMN "sex" SET DATA TYPE TEXT,
ALTER COLUMN "weight" SET DATA TYPE TEXT,
ALTER COLUMN "height" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "WaitingList" ADD COLUMN     "createdAt" TIMESTAMP(6) NOT NULL,
ADD COLUMN     "deletedAt" TIMESTAMP(6);

-- CreateIndex
CREATE UNIQUE INDEX "Avatar_image_key" ON "Avatar"("image");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_image_key" ON "Exercise"("image");

-- CreateIndex
CREATE UNIQUE INDEX "Map_image_key" ON "Map"("image");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_image_key" ON "Patient"("image");

-- CreateIndex
CREATE UNIQUE INDEX "User_image_key" ON "User"("image");
