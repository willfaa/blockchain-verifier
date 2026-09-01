"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  GripVertical,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";

interface CompetencyUnit {
  id: string;
  courseId: string;
  code: string;
  title: string;
  standard: string;
  order: number;
}

const RPL_PRESET_UNITS = [
  { code: "J.620100.004.01", title: "Menerapkan Pemrograman Berorientasi Objek (OOP)", standard: "SKKNI" },
  { code: "J.620100.009.02", title: "Menggunakan Struktur Data dan Algoritma Dasar", standard: "SKKNI" },
  { code: "J.620100.017.02", title: "Mengimplementasikan Basis Data Relasional (SQL/PostgreSQL)", standard: "SKKNI" },
  { code: "J.620100.025.02", title: "Melakukan Pengujian Perangkat Lunak (Software Unit Testing)", standard: "SKKNI" },
  { code: "J.620100.033.02", title: "Mengembangkan Arsitektur API dan Smart Contract Terdistribusi", standard: "SKKNI" },
];

const TKJ_PRESET_UNITS = [
  { code: "J.611000.001.01", title: "Memasang Jaringan Nirkabel (Wireless Network)", standard: "SKKNI" },
  { code: "J.611000.005.02", title: "Mengkonfigurasi Routing pada Perangkat Jaringan MikroTik / Cisco", standard: "SKKNI" },
  { code: "J.611000.009.01", title: "Mengadministrasi Server Jaringan Linux / Windows Server", standard: "SKKNI" },
  { code: "J.611000.012.02", title: "Mengkonfigurasi Keamanan Jaringan dan Firewall", standard: "SKKNI" },
];

export default function CourseCompetencyUnitsPage() {
  const params = useParams();
  const courseId = params?.courseId as string;

  const [units, setUnits] = useState<CompetencyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form state for new unit
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newStandard, setNewStandard] = useState("SKKNI");
  const [showAddForm, setShowAddForm] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editStandard, setEditStandard] = useState("SKKNI");

  const fetchUnits = async () => {
    if (!courseId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/lms/courses/${courseId}/competency-units`);
      if (res.data?.ok && Array.isArray(res.data?.data)) {
        setUnits(res.data.data);
      }
    } catch (err: any) {
      console.error("Fetch Units Error:", err);
      setError(err.response?.data?.error || "Gagal memuat daftar unit kompetensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [courseId]);

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newTitle.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await api.post(`/lms/courses/${courseId}/competency-units`, {
        code: newCode.trim(),
        title: newTitle.trim(),
        standard: newStandard.trim(),
        order: units.length,
      });

      if (res.data?.ok) {
        setNewCode("");
        setNewTitle("");
        setNewStandard("SKKNI");
        setShowAddForm(false);
        setSuccessMsg("Unit kompetensi berhasil ditambahkan");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchUnits();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menyimpan unit kompetensi");
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (unit: CompetencyUnit) => {
    setEditingId(unit.id);
    setEditCode(unit.code);
    setEditTitle(unit.title);
    setEditStandard(unit.standard || "SKKNI");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleUpdateUnit = async (id: string) => {
    if (!editCode.trim() || !editTitle.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await api.put(`/lms/courses/${courseId}/competency-units/${id}`, {
        code: editCode.trim(),
        title: editTitle.trim(),
        standard: editStandard.trim(),
      });

      if (res.data?.ok) {
        setEditingId(null);
        setSuccessMsg("Unit kompetensi berhasil diperbarui");
        setTimeout(() => setSuccessMsg(null), 3000);
        fetchUnits();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal memperbarui unit kompetensi");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus unit kompetensi ini?")) return;

    setSaving(true);
    try {
      await api.delete(`/lms/courses/${courseId}/competency-units/${id}`);
      setSuccessMsg("Unit kompetensi telah dihapus");
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchUnits();
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal menghapus unit kompetensi");
    } finally {
      setSaving(false);
    }
  };

  const handleLoadPreset = async (presetList: typeof RPL_PRESET_UNITS) => {
    if (units.length > 0) {
      if (!confirm("Preset ini akan menambahkan unit baru ke daftar yang sudah ada. Lanjutkan?")) {
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      for (let i = 0; i < presetList.length; i++) {
        const item = presetList[i];
        await api.post(`/lms/courses/${courseId}/competency-units`, {
          code: item.code,
          title: item.title,
          standard: item.standard,
          order: units.length + i,
        });
      }
      setSuccessMsg(`Berhasil memuat ${presetList.length} unit kompetensi standar!`);
      setTimeout(() => setSuccessMsg(null), 4000);
      fetchUnits();
    } catch (err: any) {
      setError("Gagal memuat preset: " + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Top Title Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-5 w-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              Unit Kompetensi SKKNI / BNSP (Halaman Belakang Sertifikat)
            </h2>
          </div>
          <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
            Kelola daftar unit kompetensi yang otomatis tercetak pada Halaman 2 (Transkrip Belakang Sertifikat UKK Resmi Duplex Print).
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 shrink-0"
          >
            {showAddForm ? <X size={15} /> : <Plus size={15} />}
            <span>{showAddForm ? "Tutup Form" : "Tambah Unit Baru"}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 1-Click Presets */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-bold text-white/80">Preset Standar Cepat:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => handleLoadPreset(RPL_PRESET_UNITS)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all disabled:opacity-50"
          >
            + Preset RPL (Rekayasa Perangkat Lunak)
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => handleLoadPreset(TKJ_PRESET_UNITS)}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all disabled:opacity-50"
          >
            + Preset TKJ (Teknik Komputer & Jaringan)
          </button>
        </div>
      </div>

      {/* Form Add Unit */}
      {showAddForm && (
        <form
          onSubmit={handleCreateUnit}
          className="p-6 rounded-3xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 shadow-2xl"
        >
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">
            Tambah Unit Kompetensi Baru
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Kode Unit (Contoh: J.620100.004.01)
              </label>
              <input
                type="text"
                required
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="J.620100.004.01"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Judul Unit Kompetensi
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Menerapkan Pemrograman Berorientasi Objek (OOP)"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="w-48">
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1.5">
                Standar
              </label>
              <input
                type="text"
                value={newStandard}
                onChange={(e) => setNewStandard(e.target.value)}
                placeholder="SKKNI / BNSP"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/60 hover:text-white text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {saving && <Loader2 size={13} className="animate-spin" />}
                <span>Simpan Unit</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Unit List Table */}
      <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white/80 uppercase tracking-wider">
            Daftar Unit Terdaftar ({units.length} Unit)
          </h3>
          <span className="text-[11px] text-white/40 font-mono">
            Transkrip Otomatis Dicetak pada Halaman 2
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-white/40 flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            <span className="text-xs">Memuat unit kompetensi...</span>
          </div>
        ) : units.length === 0 ? (
          <div className="py-12 text-center text-white/40 space-y-3">
            <BookOpen className="h-10 w-10 mx-auto text-white/20" />
            <p className="text-xs">Belum ada unit kompetensi SKKNI untuk kursus ini.</p>
            <p className="text-[11px] text-white/30">
              Gunakan tombol <strong>+ Preset RPL / TKJ</strong> di atas atau klik <strong>Tambah Unit Baru</strong>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-white/60 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 w-44">Kode Unit</th>
                  <th className="py-3 px-4">Judul Unit Kompetensi</th>
                  <th className="py-3 px-4 w-28 text-center">Standar</th>
                  <th className="py-3 px-4 w-24 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {units.map((unit, idx) => {
                  const isEditing = editingId === unit.id;
                  return (
                    <tr key={unit.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-center font-mono text-white/40">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCode}
                            onChange={(e) => setEditCode(e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-xs font-mono text-cyan-400"
                          />
                        ) : (
                          <span className="font-bold text-cyan-400">{unit.code}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-xs text-white"
                          />
                        ) : (
                          <span className="text-white/90 font-medium">{unit.title}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-white/50">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editStandard}
                            onChange={(e) => setEditStandard(e.target.value)}
                            className="w-20 px-2 py-1 rounded bg-slate-900 border border-cyan-500 text-xs text-center font-mono text-white"
                          />
                        ) : (
                          <span>{unit.standard || "SKKNI"}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateUnit(unit.id)}
                              className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                              title="Simpan"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:text-white"
                              title="Batal"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(unit)}
                              className="p-1.5 rounded-lg text-white/50 hover:text-cyan-400 hover:bg-white/5 transition-colors"
                              title="Edit Unit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-white/5 transition-colors"
                              title="Hapus Unit"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
