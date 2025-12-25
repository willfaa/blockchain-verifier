// app/teacher/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { stripHtml } from "@/lib/utils";
import Link from "next/link";
import { Plus, BookOpen, Clock } from "lucide-react";

export default function Dashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    // Ambil data kursus dari backend (Draft + Published via new endpoint)
    api
      .get("/lms/teacher/my-courses")
      .then((res) => setCourses(res.data.data))
      .catch((err) => {
        console.error(err);
        if (err.response && err.response.status === 403) {
          setError(
            err.response.data?.error ||
              "Access Denied. Your account might not be verified."
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your courses and content
          </p>
        </div>
        <Link
          href="/teacher/create-course"
          className="flex items-center gap-2 bg-linear-to-r from-cyan-400 to-blue-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/25 hover:scale-105 transition-transform"
        >
          <Plus size={18} />
          Create Course
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl mb-6">
          <p className="font-bold">Error loading courses</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-slate-400">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="border border-dashed border-white/20 rounded-2xl p-12 text-center bg-white/5">
          <BookOpen className="mx-auto h-12 w-12 text-slate-500 mb-4" />
          <h3 className="text-lg font-medium text-white">No courses yet</h3>
          <p className="text-slate-400 text-sm mb-6">
            Start by creating your first learning material.
          </p>
          <Link
            href="/teacher/create-course"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold"
          >
            Create a Course &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/teacher/courses/${course.id}/manage/basics`}
              className="group relative bg-[#0d0b2f] border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all hover:-translate-y-1 shadow-xl block"
            >
              <div className="aspect-video w-full bg-slate-800 relative">
                {course.thumbnail ? (
                  <img
                    src={`http://localhost:4000${course.thumbnail}`}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-800 to-slate-900">
                    <BookOpen className="text-slate-600 h-10 w-10" />
                  </div>
                )}

                {/* Overlay on Hover */}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-cyan-500 text-black font-bold px-4 py-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    Manage Course
                  </span>
                </div>

                {/* Badge Status */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 z-10">
                  {course.isPublished ? "Published" : "Draft"}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4 h-10">
                  {stripHtml(course.description)}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock size={12} />
                    <span>Updated recently</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-400 group-hover:text-cyan-300 uppercase tracking-wide">
                    MANAGE &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
