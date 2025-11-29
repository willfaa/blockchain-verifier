// frontend/app/courses/page.tsx
import Image from "next/image";
import Link from "next/link";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Features", href: "/#features" },
  { label: "About", href: "/#about" },
  { label: "Verification", href: "/verify" },
];

const progressItems = [
  { label: "Overall course completion", value: 64 },
  { label: "Blockchain track", value: 72 },
  { label: "Security track", value: 48 },
];

async function getCourses() {
  const res = await fetch("http://localhost:4000/courses", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch courses");
  }
  return res.json();
}

export default async function CoursesPage() {
  const data = await getCourses();
  const courses = data.courses || [];

  return (
    <div className="min-h-screen bg-linear-to-b from-[#0b0724] via-[#0d0b2f] to-[#130f3d] text-slate-50">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute right-0 top-40 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0b2f]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10 lg:px-14">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-cyan-400 via-blue-500 to-fuchsia-500 text-lg font-semibold text-slate-950 shadow-lg shadow-cyan-500/25">
              Cn
            </div>
            <div>
              <p className="text-lg font-semibold">Chainnesa</p>
              <p className="text-xs text-slate-300">
                Blockchain-based Learning Management System
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-200 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="transition hover:text-white hover:underline"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <Link
              href="/verify"
              className="hidden rounded-full border border-white/25 px-4 py-2 font-semibold transition hover:border-white hover:-translate-y-0.5 md:inline-flex"
            >
              Verify
            </Link>
            <Link
              href="/issuer"
              className="rounded-full bg-linear-to-r from-fuchsia-500 via-orange-400 to-amber-300 px-4 py-2 font-semibold text-slate-950 shadow-lg shadow-fuchsia-500/25 transition hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto flex max-w-6xl flex-col px-6 sm:px-10 lg:px-14">
        <section className="grid grid-cols-1 items-start gap-8 pb-12 pt-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-100 ring-1 ring-white/20">
              Courses - Chainnesa LMS
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Choose a course and continue your learning path
            </h1>
            <p className="max-w-2xl text-base text-slate-200 sm:text-lg">
              All courses inherit blockchain-backed progress and verifiable
              completion records. Start with a track, then dive into individual
              modules at your pace.
            </p>
            <div className="flex gap-3 text-sm">
              <Link
                href="/"
                className="rounded-full border border-white/25 px-4 py-2 font-semibold transition hover:border-white hover:-translate-y-0.5"
              >
                Back to home
              </Link>
              <Link
                href="/verify"
                className="rounded-full bg-white px-4 py-2 font-semibold text-slate-900 shadow-lg shadow-cyan-500/25 transition hover:-translate-y-0.5"
              >
                Go to verification
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/25">
            <p className="text-sm font-semibold text-white">Progress tracker</p>
            <p className="mt-1 text-xs text-slate-300">
              Overview of your current learning pace across tracks.
            </p>
            <div className="mt-4 space-y-4">
              {progressItems.map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-200">
                    <span>{item.label}</span>
                    <span className="font-semibold text-cyan-200">
                      {item.value}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-400"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-200">
              <p className="font-semibold text-white">
                Verification stays the same
              </p>
              <p className="mt-2">
                Issuance and verification flows remain unchanged. Each completed
                course anchors a verifiable record you can check via certId.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6 pb-14">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100">
              Course Catalog
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Browse and jump into a course
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course: any) => (
              <Link
                key={course.id ?? course.slug ?? course.title}
                href={course.href}
                className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg shadow-black/25 transition hover:-translate-y-1 hover:border-white/20 hover:shadow-fuchsia-500/20"
              >
                <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-2xl transition group-hover:scale-110" />
                <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                  <Image
                    src="/course/placeholder.svg"
                    alt={course.title || "Course"}
                    width={320}
                    height={220}
                    className="h-32 w-full object-cover"
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-wide text-cyan-100">
                  <span>{course.modulesCount} Modules</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
                <h3 className="mt-2 text-lg font-semibold text-white">
                  {course.title}
                </h3>
                <p className="text-sm text-slate-200">
                  {course.description || "No description available."}
                </p>
                <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition group-hover:text-white">
                  View course
                  <span aria-hidden>-&gt;</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
