/*
  Warnings:

  - You are about to drop the column `duration` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `exams` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[courseId]` on the table `exams` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'ESSAY');

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "duration",
DROP COLUMN "isPublished",
ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "isEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "type" "QuestionType" NOT NULL DEFAULT 'MULTIPLE_CHOICE';

-- CreateIndex
CREATE UNIQUE INDEX "exams_courseId_key" ON "exams"("courseId");
