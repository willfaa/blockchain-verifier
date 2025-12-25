-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "strictMode" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "user_answers" (
    "id" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "user_answers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "exam_results"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_answers" ADD CONSTRAINT "user_answers_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
