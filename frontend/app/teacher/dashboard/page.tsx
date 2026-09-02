// app/teacher/dashboard/page.tsx
"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { stripHtml, getAssetUrl } from "@/lib/utils";
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
    <div className="font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
        <div className="animate-in fade-in slide-in-from-left-6 duration-700">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Academic <span className="text-neon-purple">Management</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-3">
            Teacher Workspace Hub
          </p>
        </div>
        <Link
          href="/teacher/create-course"
          className="group relative flex items-center gap-3 bg-neon-purple text-white px-10 py-5 rounded-3xl font-bold text-xs uppercase tracking-widest shadow-[0_0_30px_rgba(176,38,255,0.2)] hover:shadow-[0_0_50px_rgba(176,38,255,0.4)] transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <Plus
            size={20}
            className="group-hover:rotate-180 transition-transform duration-500"
          />
          Create New Course
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-3xl mb-12 animate-in slide-in-from-top-4">
          <p className="font-bold uppercase tracking-widest text-[10px] mb-2">
            System Notice
          </p>
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 border-4 border-white/5 border-t-neon-blue rounded-full animate-spin"></div>
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] p-32 text-center border-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-neon-purple/[0.02] group-hover:bg-neon-purple/[0.05] transition-colors"></div>
          <BookOpen className="mx-auto h-20 w-20 text-white/5 mb-8 group-hover:scale-110 transition-transform duration-700" />
          <h3 className="text-2xl font-bold text-white tracking-tight mb-4">
            No Courses Found
          </h3>
          <p className="text-white/30 text-sm font-medium mb-12 max-w-sm mx-auto leading-relaxed">
            Your instructional dashboard is currently clear. Start by adding a
            new learning module to your curriculum.
          </p>
          <Link
            href="/teacher/create-course"
            className="inline-flex items-center gap-3 text-neon-blue hover:text-white text-xs font-bold uppercase tracking-widest transition-all"
          >
            Add Your First Course <Plus size={16} />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {courses.map((course, idx) => {
            const colors = [
              "text-neon-purple border-neon-purple/20",
              "text-neon-blue border-neon-blue/20",
              "text-neon-pink border-neon-pink/20",
              "text-neon-soft-blue border-neon-soft-blue/20",
            ];
            const hoverBorders = [
              "hover:border-neon-purple/50",
              "hover:border-neon-blue/50",
              "hover:border-neon-pink/50",
              "hover:border-neon-soft-blue/50",
            ];

            return (
              <Link
                key={course.id}
                href={`/teacher/courses/${course.id}/manage/basics`}
                className={`group relative glass-panel rounded-[2rem] overflow-hidden transition-all duration-700 hover:-translate-y-3 hover:shadow-3xl block border-transparent ${
                  hoverBorders[idx % 4]
                }`}
              >
                <div className="aspect-[16/10] w-full bg-slate-900/50 relative overflow-hidden">
                  {course.imageUrl || course.thumbnail ? (
                    <img
                      src={getAssetUrl(course.imageUrl || course.thumbnail)}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                      <BookOpen className="text-white/5 h-20 w-20 group-hover:text-white/10 transition-colors" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-5 right-5 z-10">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-2xl border backdrop-blur-xl ${
                        course.isPublished
                          ? "bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_15px_rgba(74,222,128,0.1)]"
                          : "bg-white/5 text-white/40 border-white/10"
                      }`}
                    >
                      {course.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/90 via-dark-bg/20 to-transparent opacity-80"></div>
                </div>

                <div className="p-10">
                  <h3
                    className={`font-bold text-xl text-white mb-4 line-clamp-1 transition-colors tracking-tight`}
                  >
                    {course.title}
                  </h3>
                  <p className="text-white/40 text-[12px] font-medium leading-relaxed mb-10 h-10 line-clamp-2">
                    {stripHtml(course.description)}
                  </p>

                  <div className="flex items-center justify-between pt-8 border-t border-white/5 font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-3 text-[10px] text-white/30">
                      <Clock size={14} className="text-neon-blue" />
                      <span>Updated Recently</span>
                    </div>
                    <span
                      className={`text-[10px] transition-all group-hover:translate-x-2 ${
                        colors[idx % 4].split(" ")[0]
                      }`}
                    >
                      Edit Workspace &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
