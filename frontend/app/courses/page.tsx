//frontend/src/app/courses/page.tsx
"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import CourseCard from "@/components/features/CourseCard";
import { BookOpen, Loader2 } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Public Courses
    api
      .get("/lms/courses")
      .then((res) => {
        setCourses(res.data.data);
      })
      .catch((err) => console.error("Failed to load courses", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans selection:bg-neon-purple/30 overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-10 pt-40 pb-32 relative">
        {/* Glow Backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-neon-purple/5 blur-[150px] rounded-full pointer-events-none"></div>

        <div className="text-center mb-32 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <p className="text-[10px] font-bold text-neon-blue uppercase tracking-[0.6em] mb-6">
            Institutional Catalog // Professional Education
          </p>
          <h1 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
            Academic <span className="galaxy-gradient-text">Curriculum</span>
          </h1>
          <p className="text-white/40 max-w-2xl mx-auto text-sm font-medium leading-relaxed">
            Discover a premium selection of high-fidelity courses, designed for
            institutional success and individual growth. Every learning track is
            verified for professional excellence and global recognition.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-8 relative z-10">
            <div className="h-16 w-16 border-4 border-white/5 border-t-neon-purple rounded-full animate-spin shadow-[0_0_20px_rgba(176,38,255,0.2)]"></div>
            <p className="text-white/40 font-bold text-[10px] uppercase tracking-[0.5em] animate-pulse">
              Preparing Course Library
            </p>
          </div>
        ) : (courses?.length || 0) === 0 ? (
          <div className="glass-panel p-24 rounded-[2.5rem] text-center max-w-xl mx-auto border-white/5 relative z-10 animate-in fade-in duration-1000">
            <BookOpen className="mx-auto h-20 w-20 text-white/5 mb-8" />
            <h3 className="text-2xl font-bold text-white tracking-tight">
              Library Currently Updating
            </h3>
            <p className="text-white/30 mt-6 text-sm font-medium leading-relaxed">
              We are currently finalizing new academic content. Please check
              back shortly for our updated curriculum selection.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 relative z-10">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="animate-in fade-in zoom-in-95"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category || "General"}
                  image={
                    course.imageUrl || course.thumbnail
                      ? getAssetUrl(course.imageUrl || course.thumbnail)
                      : ""
                  }
                  teacherName={course.teacher?.name}
                  lessonCount={course._count?.lessons || 0}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
