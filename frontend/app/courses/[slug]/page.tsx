// frontend/app/courses/%5Bslug%5D/page.tsx
import CourseDetailClient, {
  CourseData,
  ModuleSection,
} from "../CourseDetailClient";

async function fetchCourses(): Promise<CourseData[]> {
  try {
    const res = await fetch("http://localhost:4000/courses", {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data?.courses ?? [];
  } catch (err) {
    console.error("Failed to fetch courses:", err);
    return [];
  }
}

const fallbackModules: ModuleSection[] = [
  {
    title: "Pengenalan UX Research",
    lessons: [
      {
        type: "Video",
        title: "Pengalaman Pengguna (UX) dan Pentingnya Penelitian UX",
        duration: "02:50",
      },
      {
        type: "Reading",
        title: "Peran Utama Penelitian UX dalam Desain Produk",
        duration: "10 min",
      },
      { type: "Quiz", title: "Quiz", duration: "5 questions" },
    ],
  },
  {
    title: "Metode Penelitian UX",
    lessons: [
      {
        type: "Video",
        title: "Metode Kualitatif dalam penelitian UX",
        duration: "04:12",
      },
      {
        type: "Reading",
        title: "Metode Kuantitatif dalam penelitian UX",
        duration: "8 min",
      },
      { type: "Quiz", title: "Quiz", duration: "5 questions" },
    ],
  },
  {
    title: "Pengumpulan Data",
    lessons: [
      {
        type: "Video",
        title: "Desain Pertanyaan dan Instrumen Penelitian",
        duration: "05:20",
      },
      {
        type: "Reading",
        title: "Pengumpulan Data Secara Etis dan Efektif",
        duration: "9 min",
      },
      { type: "Quiz", title: "Quiz", duration: "5 questions" },
    ],
  },
  {
    title: "Analisis Data UX",
    lessons: [
      {
        type: "Video",
        title: "Pengolahan dan Visualisasi Data",
        duration: "03:45",
      },
      {
        type: "Reading",
        title: "Menerjemahkan Temuan UX menjadi Insight Produk",
        duration: "7 min",
      },
      { type: "Quiz", title: "Quiz", duration: "5 questions" },
    ],
  },
];

export default async function CourseDetailPage({
  params,
}: {
  params: { slug: string } | Promise<{ slug: string }>;
}) {
  const resolvedParams = await Promise.resolve(params as any);
  const slug = resolvedParams?.slug;

  const fetched = await fetchCourses();
  const courses = Array.isArray(fetched) ? fetched : [];
  const course: CourseData = courses.find((c) => c.slug === slug) ||
    courses.find((c) => c.href === `/courses/${slug}`) || {
      title: "Course",
      description: "Details not available from API. Showing sample content.",
      modulesCount: fallbackModules.length,
    };

  const modules = fallbackModules;
  const totalLessons = modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0
  );

  return (
    <CourseDetailClient
      course={course}
      modules={modules}
      totalLessons={totalLessons}
    />
  );
}
