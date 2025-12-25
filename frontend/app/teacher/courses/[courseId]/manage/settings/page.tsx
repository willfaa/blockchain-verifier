"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trash2, AlertTriangle, CheckCircle, Lock } from "lucide-react";
import Modal from "@/components/ui/Modal";

import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

export default function CourseSettingsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, []);

  const fetchCourse = () => {
    setLoading(true);
    // Use params.courseId
    api
      .get(`/lms/teacher/courses/${courseId}`)
      .then((res) => setCourse(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const hasContent = course && course.chapters && course.chapters.length > 0;

  const togglePublish = async () => {
    if (!course) return;

    // Only check content if we are trying to PUBLISH (going from false -> true)
    if (!course.isPublished && !hasContent) {
      toast.error(
        "Cannot publish an empty course. Add chapters and lessons first."
      );
      return;
    }

    try {
      setPublishing(true);
      const res = await api.put(`/lms/courses/${courseId}`, {
        isPublished: !course.isPublished,
      });
      setCourse(res.data.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to update status");
    } finally {
      setPublishing(false);
    }
  };

  // ... inside component
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ... fetchCourse ... togglePublish ...

  const confirmDelete = () => {
    setDeleting(true);
    api
      .delete(`/lms/courses/${courseId}`)
      .then(() => {
        router.push("/teacher/dashboard");
      })
      .catch((err) => {
        toast.error("Failed to delete course");
        setDeleting(false);
      });
  };

  if (loading)
    return (
      <div className="text-teal-400 font-mono animate-pulse">Loading_...</div>
    );

  return (
    <div className="space-y-8 font-mono">
      {/* ... Header and Visibility Card ... */}
      <div className="border-b border-teal-900/30 pb-4">
        <h1 className="text-2xl font-bold text-white uppercase tracking-tight">
          Course_Settings
        </h1>
        <p className="text-teal-500/60 text-xs">
          Manage lifecycle and danger zone.
        </p>
      </div>

      {/* Visibility Card */}
      <div className="bg-[#050510] border border-teal-900/50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-teal-100 uppercase flex items-center gap-2">
              <GlobeIcon isPublic={course.isPublished} />
              {course.isPublished ? "Public_Deployment" : "Draft_State"}
            </h3>
            <p className="text-teal-500/50 text-xs mt-1 max-w-md">
              {course.isPublished
                ? "This course is live. Students can enroll and view content."
                : "Only you can see this course. Students cannot enroll."}
            </p>

            {!hasContent && !course.isPublished && (
              <div className="mt-4 flex items-center gap-2 text-orange-400 text-xs bg-orange-900/10 p-2 rounded border border-orange-500/20">
                <AlertTriangle size={14} />
                <span>Course must have chapters to be published.</span>
              </div>
            )}
          </div>

          <button
            onClick={togglePublish}
            disabled={publishing || (!hasContent && !course.isPublished)}
            className={`px-6 py-2 font-bold uppercase text-xs rounded transition-all border ${
              course.isPublished
                ? "bg-teal-900/10 border-teal-500 text-teal-400 hover:bg-teal-900/30"
                : "bg-teal-500 text-black border-teal-500 hover:bg-teal-400"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {publishing
              ? "Updating..."
              : course.isPublished
              ? "Unpublish"
              : "Publish_Now"}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-900/30 bg-red-900/5 rounded-lg p-6 mt-12">
        <h3 className="text-red-500 font-bold uppercase text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={16} /> Danger_Zone
        </h3>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-400/80 text-xs font-bold">
              Delete this course
            </p>
            <p className="text-red-500/40 text-[10px]">
              Once deleted, it will be gone forever. Enrolled students will lose
              access.
            </p>
          </div>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="px-4 py-2 bg-red-900/20 border border-red-900 text-red-500 text-xs font-bold uppercase rounded hover:bg-red-900/40 hover:text-red-400 transition-colors"
          >
            Delete_Course
          </button>
        </div>
      </div>

      {/* Cyberpunk Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete Course?"
        description={`Are you sure you want to delete "${course?.title}"? This action cannot be undone and all data will be lost.`}
        confirmText="Yes, Delete It"
        variant="danger"
        onConfirm={confirmDelete}
        isLoading={deleting}
      />
    </div>
  );
}

function GlobeIcon({ isPublic }: { isPublic: boolean }) {
  if (isPublic) return <CheckCircle size={18} className="text-green-500" />;
  return <Lock size={18} className="text-orange-500" />;
}
