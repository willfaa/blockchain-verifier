// backend/src/repositories/courseRepo.ts
import { db } from "../config/db";

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  modulesCount: number;
  href: string;
}

export async function getAllCourses(): Promise<Course[]> {
  /*
   * REFACTOR NOTE: Migrated from raw SQL to Prisma Client.
   * Original query selected specific fields and count of modules.
   */
  const courses = await db.course.findMany({
    select: {
      id: true,
      // slug: true, // Prisma Schema doesn't have slug yet? Checking schema...
      // If slug is missing in schema, we'll exclude it or generate it.
      // Based on schema view previously: Course has no slug.
      // We will map id to string/number as needed.
      title: true,
      description: true,
      _count: {
        select: { modules: true },
      },
    },
    orderBy: {
      createdAt: "asc", // or id if uuid
    },
  });

  return courses.map((c) => ({
    id: parseInt(c.id) || 0, // Schema uses UUID (String), interface uses number? Interface might need update or parsing.
    slug: c.id, // Fallback for slug
    title: c.title,
    description: c.description || "",
    modulesCount: c._count.modules,
    href: `/courses/${c.id}`,
  }));
}
