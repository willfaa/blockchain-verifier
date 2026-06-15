"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { ArrowLeft, Check, X, Filter, User, Search } from "lucide-react";

export default function ManageCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const courseId = resolvedParams.id;

  const [activeTab, setActiveTab] = useState<"approval" | "progress">(
    "approval"
  );
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState("");
  const [filterProgram, setFilterProgram] = useState("");
  const [filterMajority, setFilterMajority] = useState("");

  // Selection for Bulk Action
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 1. Fetch Data
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lms/courses/${courseId}/students`);
      setStudents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  // 2. Logic Filtering (Frontend Side biar cepat)
  const getFilteredStudents = (statusFilter: string) => {
    return students.filter((item) => {
      // Filter by Status (Pending / Approved)
      const statusMatch =
        statusFilter === "pending"
          ? item.status === "pending"
          : item.status === "approved";

      // Filter by Search (Name/NIM)
      const searchLower = search.toLowerCase();
      const searchMatch =
        item.user.name.toLowerCase().includes(searchLower) ||
        (item.user.studentId && item.user.studentId.includes(searchLower));

      // Filter by Program & Majority
      const programMatch = filterProgram
        ? item.user.program === filterProgram
        : true;
      const majorityMatch = filterMajority
        ? item.user.majority === filterMajority
        : true;

      return statusMatch && searchMatch && programMatch && majorityMatch;
    });
  };

  // 3. Logic Approval
  const handleStatusUpdate = async (
    ids: string[],
    newStatus: "approved" | "rejected"
  ) => {
    if (
      !confirm(`Are you sure you want to ${newStatus} ${ids.length} students?`)
    )
      return;

    try {
      await api.put("/lms/enrollments/status", {
        enrollmentIds: ids,
        status: newStatus,
      });
      alert("Success!");
      setSelectedIds([]);
      fetchStudents(); // Refresh data
    } catch (error) {
      alert("Action failed");
    }
  };

  // 4. Helper for Unique Dropdown Options
  const uniquePrograms = Array.from(
    new Set(students.map((s) => s.user.program).filter(Boolean))
  );
  const uniqueMajorities = Array.from(
    new Set(students.map((s) => s.user.majority).filter(Boolean))
  );

  return (
    <div className="min-h-screen bg-[#0b0724] text-slate-200 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href="/teacher/dashboard"
            className="text-slate-400 hover:text-white flex items-center gap-2 mb-2 text-sm"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Manage Students</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6">
        <button
          onClick={() => setActiveTab("approval")}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === "approval"
              ? "text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Approvals Needed
          {/* Badge Counter */}
          <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">
            {students.filter((s) => s.status === "pending").length}
          </span>
          {activeTab === "approval" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("progress")}
          className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
            activeTab === "progress"
              ? "text-cyan-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Student Progress
          {activeTab === "progress" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400"></div>
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-[#0d0b2f] p-4 rounded-xl border border-white/10 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input
            placeholder="Search name or Student ID..."
            className="bg-transparent outline-none text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter Dropdowns */}
        <select
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
          value={filterProgram}
          onChange={(e) => setFilterProgram(e.target.value)}
        >
          <option value="">All Programs</option>
          {uniquePrograms.map((p: any) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <select
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none"
          value={filterMajority}
          onChange={(e) => setFilterMajority(e.target.value)}
        >
          <option value="">All Majors</option>
          {uniqueMajorities.map((m: any) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* --- TAB CONTENT: APPROVAL --- */}
      {activeTab === "approval" && (
        <div>
          {/* Bulk Action Bar */}
          {selectedIds.length > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 p-3 rounded-lg mb-4 flex items-center justify-between">
              <span className="text-sm text-cyan-300 font-semibold">
                {selectedIds.length} students selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusUpdate(selectedIds, "approved")}
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 text-xs font-bold px-4 py-2 rounded transition"
                >
                  Approve Selected
                </button>
                <button
                  onClick={() => handleStatusUpdate(selectedIds, "rejected")}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold px-4 py-2 rounded transition border border-red-500/30"
                >
                  Reject Selected
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400 font-medium">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(
                            getFilteredStudents("pending").map((s) => s.id)
                          );
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4">Name / NIM</th>
                  <th className="p-4">Program</th>
                  <th className="p-4">Date Requested</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {getFilteredStudents("pending").map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked)
                            setSelectedIds([...selectedIds, item.id]);
                          else
                            setSelectedIds(
                              selectedIds.filter((id) => id !== item.id)
                            );
                        }}
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {item.user.name}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {item.user.studentId}
                      </div>
                    </td>
                    <td className="p-4">
                      <div>{item.user.program || "-"}</div>
                      <div className="text-slate-500 text-xs">
                        {item.user.majority}
                      </div>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(item.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 flex justify-end gap-2">
                      <button
                        onClick={() =>
                          handleStatusUpdate([item.id], "approved")
                        }
                        className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                        title="Approve"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate([item.id], "rejected")
                        }
                        className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {getFilteredStudents("pending").length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">
                      No pending approvals.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB CONTENT: PROGRESS --- */}
      {activeTab === "progress" && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-400 font-medium">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Details</th>
                <th className="p-4 w-1/3">Progress</th>
                <th className="p-4 text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {getFilteredStudents("approved").map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
                        {item.user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white">
                          {item.user.name}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {item.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-300">{item.user.program}</div>
                    <div className="text-slate-500 text-xs">
                      {item.user.majority}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold w-8">
                        {item.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {item.progress === 100 ? (
                      <span className="text-green-400 text-xs font-bold border border-green-500/30 px-2 py-1 rounded bg-green-500/10">
                        Issued
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">
                        In Progress
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {getFilteredStudents("approved").length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    No active students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
