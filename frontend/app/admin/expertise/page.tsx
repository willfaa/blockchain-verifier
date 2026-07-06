"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Edit2, Trash2, Layers, BookOpen, Briefcase, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function ExpertiseFieldsPage() {
  const [activeTab, setActiveTab] = useState<"bidang" | "program" | "konsentrasi">("bidang");
  const [loading, setLoading] = useState(true);

  // Data lists
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [programList, setProgramList] = useState<any[]>([]);
  const [konsentrasiList, setKonsentrasiList] = useState<any[]>([]);

  // Modals / Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    bidangKeahlianId: "",
    programKeahlianId: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bidangRes, programRes, konsentrasiRes] = await Promise.all([
        api.get("/admin/departments/bidang"),
        api.get("/admin/departments/program"),
        api.get("/admin/departments/konsentrasi"),
      ]);

      if (bidangRes.data.ok) setBidangList(bidangRes.data.data);
      if (programRes.data.ok) setProgramList(programRes.data.data);
      if (konsentrasiRes.data.ok) setKonsentrasiList(konsentrasiRes.data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load expertise fields hierarchy");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: "",
      bidangKeahlianId: bidangList[0]?.id || "",
      programKeahlianId: programList[0]?.id || "",
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      bidangKeahlianId: item.bidangKeahlianId || "",
      programKeahlianId: item.programKeahlianId || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string, tab: string) => {
    if (!confirm("Are you sure you want to delete this item? This action might affect courses or users linked to it.")) return;

    try {
      const res = await api.delete(`/admin/departments/${tab}/${id}`);
      if (res.data.ok) {
        toast.success("Deleted successfully");
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to delete item");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      let res;
      if (editingItem) {
        // Edit Mode
        const payload: any = { name: formData.name };
        if (activeTab === "program") payload.bidangKeahlianId = formData.bidangKeahlianId;
        if (activeTab === "konsentrasi") payload.programKeahlianId = formData.programKeahlianId;

        res = await api.put(`/admin/departments/${activeTab}/${editingItem.id}`, payload);
      } else {
        // Add Mode
        const payload: any = { name: formData.name };
        if (activeTab === "program") payload.bidangKeahlianId = formData.bidangKeahlianId;
        if (activeTab === "konsentrasi") payload.programKeahlianId = formData.programKeahlianId;

        res = await api.post(`/admin/departments/${activeTab}`, payload);
      }

      if (res.data.ok) {
        toast.success(editingItem ? "Updated successfully" : "Created successfully");
        setShowAddModal(false);
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save expertise field");
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Expertise <span className="text-neon-purple">Fields</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Manage Bidang Keahlian, Program Keahlian, & Konsentrasi Keahlian (SMK)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            className="p-4 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all"
            title="Refresh Registry"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-3 bg-neon-purple text-white px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-[0_0_20px_rgba(176,38,255,0.2)] hover:shadow-[0_0_30px_rgba(176,38,255,0.4)] transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={16} /> Add New Entry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 p-1 bg-white/[0.02] rounded-2xl max-w-lg border border-white/10">
        <button
          onClick={() => setActiveTab("bidang")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 ${
            activeTab === "bidang"
              ? "bg-neon-purple text-white shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <Briefcase size={14} /> Bidang Keahlian
        </button>
        <button
          onClick={() => setActiveTab("program")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 ${
            activeTab === "program"
              ? "bg-neon-blue text-white shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <Layers size={14} /> Program Keahlian
        </button>
        <button
          onClick={() => setActiveTab("konsentrasi")}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 ${
            activeTab === "konsentrasi"
              ? "bg-neon-pink text-white shadow-lg"
              : "text-white/40 hover:text-white"
          }`}
        >
          <BookOpen size={14} /> Konsentrasi
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="text-teal-500 animate-pulse font-mono flex items-center gap-2">
          <span>&gt;</span> QUERYING_EXPERTISE_FIELDS_REGISTRY...
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-3xl border-white/5 relative overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[10px] uppercase font-bold text-white/40 tracking-wider">No</th>
                  <th className="pb-4 text-[10px] uppercase font-bold text-white/40 tracking-wider">Name</th>
                  {activeTab === "program" && (
                    <th className="pb-4 text-[10px] uppercase font-bold text-white/40 tracking-wider">Bidang Keahlian</th>
                  )}
                  {activeTab === "konsentrasi" && (
                    <th className="pb-4 text-[10px] uppercase font-bold text-white/40 tracking-wider">Program Keahlian</th>
                  )}
                  <th className="pb-4 text-right text-[10px] uppercase font-bold text-white/40 tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Bidang Keahlian List */}
                {activeTab === "bidang" &&
                  bidangList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-5 text-sm font-semibold text-white/40">{idx + 1}</td>
                      <td className="py-5 text-sm font-bold text-white">{item.name}</td>
                      <td className="py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-xl transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, "bidang")}
                            className="p-2.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Program Keahlian List */}
                {activeTab === "program" &&
                  programList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-5 text-sm font-semibold text-white/40">{idx + 1}</td>
                      <td className="py-5 text-sm font-bold text-white">{item.name}</td>
                      <td className="py-5 text-sm text-neon-blue font-bold">{item.bidangKeahlian?.name || "-"}</td>
                      <td className="py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-xl transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, "program")}
                            className="p-2.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {/* Konsentrasi Keahlian List */}
                {activeTab === "konsentrasi" &&
                  konsentrasiList.map((item, idx) => (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-5 text-sm font-semibold text-white/40">{idx + 1}</td>
                      <td className="py-5 text-sm font-bold text-white">{item.name}</td>
                      <td className="py-5 text-sm text-neon-pink font-bold">{item.programKeahlian?.name || "-"}</td>
                      <td className="py-5 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-white rounded-xl transition-all"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, "konsentrasi")}
                            className="p-2.5 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-400 hover:text-red-300 rounded-xl transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-6 z-50 animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-8 rounded-3xl shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingItem ? "Edit Expertise Field" : "Add Expertise Field"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                  Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rekayasa Perangkat Lunak"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-white font-semibold focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.05] transition-all"
                />
              </div>

              {activeTab === "program" && (
                <div>
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                    Bidang Keahlian Link
                  </label>
                  <select
                    value={formData.bidangKeahlianId}
                    onChange={(e) => setFormData({ ...formData, bidangKeahlianId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white font-semibold focus:outline-none focus:border-neon-blue/50 transition-all cursor-pointer"
                  >
                    {bidangList.map((b) => (
                      <option key={b.id} value={b.id} className="bg-slate-900">
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeTab === "konsentrasi" && (
                <div>
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                    Program Keahlian Link
                  </label>
                  <select
                    value={formData.programKeahlianId}
                    onChange={(e) => setFormData({ ...formData, programKeahlianId: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white font-semibold focus:outline-none focus:border-neon-pink/50 transition-all cursor-pointer"
                  >
                    {programList.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 border border-white/10 text-white hover:bg-white/5 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-4 bg-neon-purple text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg hover:shadow-xl transition-all"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
