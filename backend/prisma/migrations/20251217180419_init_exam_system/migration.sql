/*
  Warnings:

  - You are about to drop the column `endDate` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `passingGrade` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `exams` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswer` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `explanation` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `optionA` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `optionB` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `optionC` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `optionD` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the `student_exams` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updatedAt` to the `exams` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "student_exams" DROP CONSTRAINT "student_exams_examId_fkey";

-- DropForeignKey
ALTER TABLE "student_exams" DROP CONSTRAINT "student_exams_studentId_fkey";

-- AlterTable
ALTER TABLE "exams" DROP COLUMN "endDate",
DROP COLUMN "passingGrade",
DROP COLUMN "startDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passingScore" INTEGER NOT NULL DEFAULT 70,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "duration" SET DEFAULT 60;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "correctAnswer",
DROP COLUMN "explanation",
DROP COLUMN "image",
DROP COLUMN "optionA",
DROP COLUMN "optionB",
DROP COLUMN "optionC",
DROP COLUMN "optionD",
ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 10;

-- DropTable
DROP TABLE "student_exams";

-- CreateTable
CREATE TABLE "options" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "questionId" TEXT NOT NULL,

    CONSTRAINT "options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_results" (
    "id" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "finishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_results_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "options" ADD CONSTRAINT "options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
