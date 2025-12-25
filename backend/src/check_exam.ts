import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkExam() {
  const id = "7e139703-6c8d-4dbf-93e1-2bd2d923b832";
  console.log("Checking Exam ID:", id);

  try {
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: { course: { select: { title: true } } },
    });

    if (exam) {
      console.log("FOUND EXAM:");
      console.log(JSON.stringify(exam, null, 2));
    } else {
      console.log("Exam NOT FOUND in database.");

      // List all exams to help debug
      const allExams = await prisma.exam.findMany({
        select: { id: true, title: true, isEnabled: true },
      });
      console.log("Available Exams:", allExams);
    }
  } catch (e) {
    console.error("Error asking DB:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkExam();
