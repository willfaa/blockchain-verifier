import { query } from "./db";

export interface Course {
  id: number;
  slug: string;
  title: string;
  description: string;
  modulesCount: number;
  href: string;
}

export async function getAllCourses(): Promise<Course[]> {
  const sql = `
    SELECT
      id,
      slug,
      title,
      description,
      modules_count AS "modulesCount",
      href
    FROM courses
    ORDER BY id ASC
  `;

  return query<Course>(sql);
}
