import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("--- DEBUG COURSE MODULES ---");
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          lessons: true,
          assignments: true,
          _count: true,
        },
      },
    },
  });

  console.log(`Found ${courses.length} courses.`);

  for (const c of courses) {
    console.log(`Course [${c.title}] (ID: ${c.id})`);
    console.log(`  - Module Count: ${c.modules.length}`);
    c.modules.forEach((ch: any) => {
      console.log(`    - Module: ${ch.title} (ID: ${ch.id})`);
      console.log(`      - Lessons: ${ch.lessons.length}`);
      // @ts-ignore
      console.log(`      - Assignments: ${ch.assignments?.length ?? "N/A"}`);
    });
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
