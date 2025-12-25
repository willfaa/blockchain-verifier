"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Navbar } from "@/components/layout/Navbar";
import CourseCard from "@/components/features/CourseCard";
import { BookOpen, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-[#0b0724] text-slate-50">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <p className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 animate-in fade-in slide-in-from-bottom-4">
            Course Catalog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-linear-to-r from-cyan-400 via-blue-500 to-fuchsia-500 animate-in fade-in slide-in-from-bottom-6 duration-700">
            Explore Verified Knowledge
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Discover a wide range of courses secured by blockchain technology.
            Every achievement is verifiable and permanent.
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 text-cyan-400">
            <Loader2 size={48} className="animate-spin mb-4" />
            <p className="text-slate-500 text-sm tracking-wider">
              Loading Library...
            </p>
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-3xl border border-white/10 max-w-lg mx-auto">
            <div className="bg-slate-900/50 p-4 rounded-full mb-4">
              <BookOpen className="h-12 w-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-bold text-white">
              No Courses Available
            </h3>
            <p className="text-slate-400 mt-2 text-sm">
              Our library is currently empty. Check back soon for new content.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {courses.map((course, idx) => (
              <div
                key={course.id}
                className="h-[380px]" // Fixed height container for uniform grid
                style={{ animationDelay: `${idx * 50}ms` }} // Stagger animation
              >
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  category={course.category || "General"}
                  image={
                    course.thumbnail
                      ? `http://localhost:4000${course.thumbnail}`
                      : ""
                  }
                  teacherName={course.teacher?.name}
                  lessonCount={course._count?.lessons || 0} // requires aggregated count or manual check
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
