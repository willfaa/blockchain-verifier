/*
  Warnings:

  - You are about to drop the column `program` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[personalEmail]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "program",
ADD COLUMN     "personalEmail" TEXT,
ADD COLUMN     "studyProgram" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_personalEmail_key" ON "users"("personalEmail");
