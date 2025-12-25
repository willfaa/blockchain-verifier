-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "allowedPrograms" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "category" TEXT,
ADD COLUMN     "studyProgram" TEXT,
ADD COLUMN     "targetAudience" TEXT;
