"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  BookOpen,
  Briefcase,
  RefreshCw,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Search,
  ListTree,
  FolderPlus,
  Maximize2,
  Minimize2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

interface MasterUnit {
  id: string;
  code: string;
  title: string;
  standard: string;
  order: number;
  konsentrasiKeahlianId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Konsentrasi {
  id: string;
  name: string;
  programKeahlianId: string;
  programKeahlian?: any;
  masterUnits?: MasterUnit[];
}

interface Program {
  id: string;
  name: string;
  bidangKeahlianId: string;
  bidangKeahlian?: any;
  konsentrasiKeahlian?: Konsentrasi[];
}

interface Bidang {
  id: string;
  name: string;
  programKeahlian?: Program[];
}

export default function ExpertiseFieldsTreePage() {
  const [loading, setLoading] = useState(true);

  // Raw database lists
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [programList, setProgramList] = useState<Program[]>([]);
  const [konsentrasiList, setKonsentrasiList] = useState<Konsentrasi[]>([]);
  const [unitsList, setUnitsList] = useState<MasterUnit[]>([]);

  // Tree UI State
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [modalType, setModalType] = useState<"bidang" | "program" | "konsentrasi" | "unit" | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formBidangId, setFormBidangId] = useState("");
  const [formProgramId, setFormProgramId] = useState("");
  const [formKonsentrasiId, setFormKonsentrasiId] = useState("");
  const [formUnitCode, setFormUnitCode] = useState("");
  const [formUnitTitle, setFormUnitTitle] = useState("");
  const [formUnitStandard, setFormUnitStandard] = useState("SKKNI");
  const [formUnitOrder, setFormUnitOrder] = useState<number>(0);

  // Fetch all data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bidangRes, programRes, konsentrasiRes, unitsRes] = await Promise.allSettled([
        api.get("/admin/departments/bidang"),
        api.get("/admin/departments/program"),
        api.get("/admin/departments/konsentrasi"),
        api.get("/admin/departments/units"),
      ]);

      let bData: Bidang[] = [];
      let pData: Program[] = [];
      let kData: Konsentrasi[] = [];
      let uData: MasterUnit[] = [];

      if (bidangRes.status === "fulfilled" && bidangRes.value.data.ok) {
        bData = bidangRes.value.data.data || [];
        setBidangList(bData);
      }
      if (programRes.status === "fulfilled" && programRes.value.data.ok) {
        pData = programRes.value.data.data || [];
        setProgramList(pData);
      }
      if (konsentrasiRes.status === "fulfilled" && konsentrasiRes.value.data.ok) {
        kData = konsentrasiRes.value.data.data || [];
        setKonsentrasiList(kData);
      }
      if (unitsRes.status === "fulfilled" && unitsRes.value.data.ok) {
        uData = unitsRes.value.data.data || [];
        setUnitsList(uData);
      }

      // Default expand all Bidang and Programs
      const defaultExpanded: Record<string, boolean> = {};
      bData.forEach((b) => {
        defaultExpanded[`bidang-${b.id}`] = true;
      });
      pData.forEach((p) => {
        defaultExpanded[`program-${p.id}`] = true;
      });
      kData.forEach((k) => {
        defaultExpanded[`konsentrasi-${k.id}`] = true;
      });
      setExpandedNodes((prev) => ({ ...defaultExpanded, ...prev }));
    } catch (err) {
      console.error("Failed to load expertise registry:", err);
      toast.error("Gagal memuat hirarki keahlian.");
    } finally {
      setLoading(false);
    }
  };

  // Build the hierarchical tree structure
  const treeData = useMemo(() => {
    // Map units to konsentrasi
    const unitsByKonsentrasi: Record<string, MasterUnit[]> = {};
    unitsList.forEach((u) => {
      const kId = u.konsentrasiKeahlianId;
      if (!unitsByKonsentrasi[kId]) unitsByKonsentrasi[kId] = [];
      unitsByKonsentrasi[kId].push(u);
    });

    // Map konsentrasi to program
    const konsentrasiByProgram: Record<string, Konsentrasi[]> = {};
    konsentrasiList.forEach((k) => {
      const pId = k.programKeahlianId;
      if (!konsentrasiByProgram[pId]) konsentrasiByProgram[pId] = [];
      konsentrasiByProgram[pId].push({
        ...k,
        masterUnits: unitsByKonsentrasi[k.id] || [],
      });
    });

    // Map program to bidang
    const programsByBidang: Record<string, Program[]> = {};
    programList.forEach((p) => {
      const bId = p.bidangKeahlianId;
      if (!programsByBidang[bId]) programsByBidang[bId] = [];
      programsByBidang[bId].push({
        ...p,
        konsentrasiKeahlian: konsentrasiByProgram[p.id] || [],
      });
    });

    // Final Tree
    return bidangList.map((b) => ({
      ...b,
      programKeahlian: programsByBidang[b.id] || [],
    }));
  }, [bidangList, programList, konsentrasiList, unitsList]);

  // Filtered tree based on search query
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) return treeData;

    const query = searchQuery.toLowerCase();

    return treeData
      .map((bidang) => {
        const bidangMatch = bidang.name.toLowerCase().includes(query);

        const filteredPrograms = (bidang.programKeahlian || [])
          .map((program) => {
            const programMatch = program.name.toLowerCase().includes(query);

            const filteredKonsentrasi = (program.konsentrasiKeahlian || [])
              .map((konsentrasi) => {
                const konsentrasiMatch = konsentrasi.name.toLowerCase().includes(query);

                const filteredUnits = (konsentrasi.masterUnits || []).filter(
                  (u) =>
                    u.code.toLowerCase().includes(query) ||
                    u.title.toLowerCase().includes(query) ||
                    u.standard.toLowerCase().includes(query)
                );

                if (konsentrasiMatch || filteredUnits.length > 0) {
                  return {
                    ...konsentrasi,
                    masterUnits: filteredUnits.length > 0 ? filteredUnits : konsentrasi.masterUnits,
                  };
                }
                return null;
              })
              .filter(Boolean) as Konsentrasi[];

            if (programMatch || filteredKonsentrasi.length > 0) {
              return {
                ...program,
                konsentrasiKeahlian: filteredKonsentrasi.length > 0 ? filteredKonsentrasi : program.konsentrasiKeahlian,
              };
            }
            return null;
          })
          .filter(Boolean) as Program[];

        if (bidangMatch || filteredPrograms.length > 0) {
          return {
            ...bidang,
            programKeahlian: filteredPrograms.length > 0 ? filteredPrograms : bidang.programKeahlian,
          };
        }
        return null;
      })
      .filter(Boolean) as typeof treeData;
  }, [treeData, searchQuery]);

  // Expand / Collapse Helpers
  const toggleNode = (nodeKey: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeKey]: !prev[nodeKey],
    }));
  };

  const handleExpandAll = () => {
    const allExp: Record<string, boolean> = {};
    bidangList.forEach((b) => {
      allExp[`bidang-${b.id}`] = true;
    });
    programList.forEach((p) => {
      allExp[`program-${p.id}`] = true;
    });
    konsentrasiList.forEach((k) => {
      allExp[`konsentrasi-${k.id}`] = true;
    });
    setExpandedNodes(allExp);
  };

  const handleCollapseAll = () => {
    setExpandedNodes({});
  };

  // Modal Open Handlers
  const handleOpenAddBidang = () => {
    setEditingItem(null);
    setFormName("");
    setModalType("bidang");
  };

  const handleOpenEditBidang = (b: Bidang) => {
    setEditingItem(b);
    setFormName(b.name);
    setModalType("bidang");
  };

  const handleOpenAddProgram = (bidangId?: string) => {
    setEditingItem(null);
    setFormName("");
    setFormBidangId(bidangId || bidangList[0]?.id || "");
    setModalType("program");
  };

  const handleOpenEditProgram = (p: Program) => {
    setEditingItem(p);
    setFormName(p.name);
    setFormBidangId(p.bidangKeahlianId);
    setModalType("program");
  };

  const handleOpenAddKonsentrasi = (programId?: string) => {
    setEditingItem(null);
    setFormName("");
    setFormProgramId(programId || programList[0]?.id || "");
    setModalType("konsentrasi");
  };

  const handleOpenEditKonsentrasi = (k: Konsentrasi) => {
    setEditingItem(k);
    setFormName(k.name);
    setFormProgramId(k.programKeahlianId);
    setModalType("konsentrasi");
  };

  const handleOpenAddUnit = (konsentrasiId?: string) => {
    setEditingItem(null);
    setFormUnitCode("");
    setFormUnitTitle("");
    setFormUnitStandard("SKKNI");
    setFormUnitOrder(0);
    setFormKonsentrasiId(konsentrasiId || konsentrasiList[0]?.id || "");
    setModalType("unit");
  };

  const handleOpenEditUnit = (u: MasterUnit) => {
    setEditingItem(u);
    setFormUnitCode(u.code);
    setFormUnitTitle(u.title);
    setFormUnitStandard(u.standard || "SKKNI");
    setFormUnitOrder(u.order || 0);
    setFormKonsentrasiId(u.konsentrasiKeahlianId);
    setModalType("unit");
  };

  // Delete Action Handler
  const handleDelete = async (type: "bidang" | "program" | "konsentrasi" | "units", id: string, name: string) => {
    const typeLabel =
      type === "bidang"
        ? "Bidang Keahlian"
        : type === "program"
        ? "Program Keahlian"
        : type === "konsentrasi"
        ? "Konsentrasi Keahlian / Jurusan"
        : "Unit Kompetensi SKKNI";

    if (!confirm(`Hapus ${typeLabel} "${name}"?\nSemua sub-item yang terkait di bawahnya juga akan terhapus secara otomatis.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/departments/${type}/${id}`);
      if (res.data.ok) {
        toast.success(`${typeLabel} berhasil dihapus.`);
        fetchData();
      } else {
        throw new Error(res.data.error || "Gagal menghapus item");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Gagal menghapus item");
    }
  };

  // Submit Modal Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (modalType === "bidang") {
        if (!formName.trim()) {
          toast.error("Nama Bidang Keahlian wajib diisi");
          return;
        }
        if (editingItem) {
          await api.put(`/admin/departments/bidang/${editingItem.id}`, { name: formName.trim() });
          toast.success("Bidang Keahlian berhasil diperbarui.");
        } else {
          await api.post("/admin/departments/bidang", { name: formName.trim() });
          toast.success("Bidang Keahlian baru berhasil ditambahkan.");
        }
      } else if (modalType === "program") {
        if (!formName.trim() || !formBidangId) {
          toast.error("Nama Program & Bidang Keahlian wajib diisi");
          return;
        }
        if (editingItem) {
          await api.put(`/admin/departments/program/${editingItem.id}`, {
            name: formName.trim(),
            bidangKeahlianId: formBidangId,
          });
          toast.success("Program Keahlian berhasil diperbarui.");
        } else {
          await api.post("/admin/departments/program", {
            name: formName.trim(),
            bidangKeahlianId: formBidangId,
          });
          toast.success("Program Keahlian baru berhasil ditambahkan.");
        }
      } else if (modalType === "konsentrasi") {
        if (!formName.trim() || !formProgramId) {
          toast.error("Nama Konsentrasi & Program Keahlian wajib diisi");
          return;
        }
        if (editingItem) {
          await api.put(`/admin/departments/konsentrasi/${editingItem.id}`, {
            name: formName.trim(),
            programKeahlianId: formProgramId,
          });
          toast.success("Konsentrasi Keahlian berhasil diperbarui.");
        } else {
          await api.post("/admin/departments/konsentrasi", {
            name: formName.trim(),
            programKeahlianId: formProgramId,
          });
          toast.success("Konsentrasi Keahlian baru berhasil ditambahkan.");
        }
      } else if (modalType === "unit") {
        if (!formUnitCode.trim() || !formUnitTitle.trim() || !formKonsentrasiId) {
          toast.error("Kode Unit, Judul Unit, dan Jurusan wajib diisi");
          return;
        }
        const payload = {
          code: formUnitCode.trim(),
          title: formUnitTitle.trim(),
          standard: formUnitStandard.trim(),
          order: Number(formUnitOrder) || 0,
          konsentrasiKeahlianId: formKonsentrasiId,
        };

        if (editingItem) {
          await api.put(`/admin/departments/units/${editingItem.id}`, payload);
          toast.success("Unit Kompetensi SKKNI berhasil diperbarui.");
        } else {
          await api.post("/admin/departments/units", payload);
          toast.success("Unit Kompetensi SKKNI baru berhasil ditambahkan.");
        }
      }

      setModalType(null);
      setEditingItem(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Terjadi kesalahan saat menyimpan data");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-neon-purple/10 border border-neon-purple/30 text-neon-purple shadow-[0_0_15px_rgba(176,38,255,0.2)]">
              <ListTree size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Expertise <span className="text-neon-purple">Tree Directory</span>
                <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                  4 Levels Hierarchy
                </span>
              </h1>
              <p className="text-white/40 text-xs mt-1">
                Kelola struktur direktori Bidang Keahlian, Program Keahlian, Konsentrasi Keahlian, dan Master Bank Unit SKKNI/IDUKA (SMK).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchData}
            className="p-3 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all hover:bg-white/10"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-neon-purple" : ""} />
          </button>
          <button
            onClick={handleOpenAddBidang}
            className="flex items-center gap-2.5 bg-gradient-to-r from-neon-purple via-fuchsia-600 to-neon-blue text-white px-6 py-3 rounded-2xl font-bold uppercase tracking-wider text-[11px] shadow-[0_0_25px_rgba(176,38,255,0.3)] hover:shadow-[0_0_35px_rgba(176,38,255,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <FolderPlus size={16} /> Tambah Bidang Baru
          </button>
        </div>
      </div>

      {/* 4-Level Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-purple/10 to-transparent border border-neon-purple/20 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-neon-purple/20 text-neon-purple">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Level 1: Bidang</p>
            <p className="text-xl font-extrabold text-white font-mono">{bidangList.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-blue/10 to-transparent border border-neon-blue/20 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-neon-blue/20 text-neon-blue">
            <Layers size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Level 2: Program</p>
            <p className="text-xl font-extrabold text-white font-mono">{programList.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-neon-pink/10 to-transparent border border-neon-pink/20 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-neon-pink/20 text-neon-pink">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Level 3: Jurusan</p>
            <p className="text-xl font-extrabold text-white font-mono">{konsentrasiList.length}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 flex items-center gap-3.5 shadow-lg">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Level 4: Unit SKKNI</p>
            <p className="text-xl font-extrabold text-white font-mono">{unitsList.length}</p>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Tree Expanding */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-xl">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bidang, program, jurusan, atau unit SKKNI..."
            className="w-full bg-slate-950/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-neon-purple transition-all"
          />
          <Search size={16} className="absolute left-3.5 top-3 text-slate-500" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExpandAll}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Maximize2 size={13} /> Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Minimize2 size={13} /> Collapse All
          </button>
        </div>
      </div>

      {/* DIRECTORY TREE VIEW (WINDOWS EXPLORER STYLE) */}
      {loading ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-neon-purple" />
          <p className="text-xs font-mono text-neon-purple uppercase tracking-widest">
            Memuat Struktur Direktori Keahlian...
          </p>
        </div>
      ) : filteredTree.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl border border-white/5 text-center space-y-4">
          <Folder size={48} className="mx-auto text-white/20" />
          <h3 className="text-lg font-bold text-white">Tidak Ada Data Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}".`
              : "Belum ada bidang keahlian yang dibuat. Klik tombol 'Tambah Bidang Baru' di atas untuk memulai."}
          </p>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-950/70 divide-y divide-white/5">
          {filteredTree.map((bidang) => {
            const bidangKey = `bidang-${bidang.id}`;
            const isBidangExpanded = !!expandedNodes[bidangKey];
            const programCount = bidang.programKeahlian?.length || 0;

            return (
              <div key={bidang.id} className="group/bidang transition-colors">
                {/* --- LEVEL 1: BIDANG KEAHLIAN (ROOT FOLDER) --- */}
                <div
                  className={`flex items-center justify-between p-4 cursor-pointer select-none transition-all ${
                    isBidangExpanded ? "bg-neon-purple/[0.04]" : "hover:bg-white/[0.02]"
                  }`}
                  onClick={() => toggleNode(bidangKey)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(bidangKey);
                      }}
                      className="p-1 text-slate-400 hover:text-white transition-colors"
                    >
                      {isBidangExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className="p-2 rounded-xl bg-neon-purple/20 text-neon-purple border border-neon-purple/40">
                      {isBidangExpanded ? <FolderOpen size={18} /> : <Folder size={18} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white tracking-tight truncate">
                          {bidang.name}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neon-purple/10 text-neon-purple border border-neon-purple/30 font-semibold">
                          Level 1 · Bidang Keahlian
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          {programCount} Program
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Level 1 Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleOpenAddProgram(bidang.id)}
                      className="px-3 py-1.5 rounded-xl bg-neon-blue/10 hover:bg-neon-blue/20 text-neon-blue border border-neon-blue/30 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                      title="Tambah Program Keahlian di bawah Bidang ini"
                    >
                      <Plus size={13} /> Program
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditBidang(bidang)}
                      className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                      title="Edit Nama Bidang"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete("bidang", bidang.id, bidang.name)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-red-500/10 transition-colors"
                      title="Hapus Bidang Keahlian"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* --- LEVEL 2: PROGRAM KEAHLIAN (SUB-FOLDER) --- */}
                {isBidangExpanded && (
                  <div className="pl-6 md:pl-12 pr-4 pb-3 space-y-2 border-l-2 border-neon-purple/20 ml-6 my-1">
                    {bidang.programKeahlian && bidang.programKeahlian.length > 0 ? (
                      bidang.programKeahlian.map((program) => {
                        const programKey = `program-${program.id}`;
                        const isProgramExpanded = !!expandedNodes[programKey];
                        const konsentrasiCount = program.konsentrasiKeahlian?.length || 0;

                        return (
                          <div
                            key={program.id}
                            className="rounded-2xl border border-white/5 bg-slate-900/40 overflow-hidden transition-all"
                          >
                            <div
                              className={`flex items-center justify-between p-3.5 cursor-pointer select-none transition-all ${
                                isProgramExpanded ? "bg-neon-blue/[0.04]" : "hover:bg-white/[0.02]"
                              }`}
                              onClick={() => toggleNode(programKey)}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNode(programKey);
                                  }}
                                  className="p-1 text-slate-400 hover:text-white transition-colors"
                                >
                                  {isProgramExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                <div className="p-1.5 rounded-lg bg-neon-blue/20 text-neon-blue border border-neon-blue/30">
                                  {isProgramExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs sm:text-sm font-bold text-slate-200 tracking-tight truncate">
                                      {program.name}
                                    </span>
                                    <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neon-blue/10 text-neon-blue border border-neon-blue/30 font-semibold">
                                      Level 2 · Program
                                    </span>
                                    <span className="text-[9px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                                      {konsentrasiCount} Jurusan
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Level 2 Actions */}
                              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddKonsentrasi(program.id)}
                                  className="px-2.5 py-1 rounded-lg bg-neon-pink/10 hover:bg-neon-pink/20 text-neon-pink border border-neon-pink/30 text-[10px] font-semibold flex items-center gap-1 transition-all"
                                  title="Tambah Konsentrasi Keahlian / Jurusan"
                                >
                                  <Plus size={12} /> Jurusan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProgram(program)}
                                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                  title="Edit Nama Program"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete("program", program.id, program.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                  title="Hapus Program Keahlian"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* --- LEVEL 3: KONSENTRASI KEAHLIAN / JURUSAN (LEAF FOLDER) --- */}
                            {isProgramExpanded && (
                              <div className="pl-6 md:pl-10 pr-3 pb-3 pt-1 space-y-2 border-l border-neon-blue/20 ml-6 my-1">
                                {program.konsentrasiKeahlian && program.konsentrasiKeahlian.length > 0 ? (
                                  program.konsentrasiKeahlian.map((konsentrasi) => {
                                    const konsentrasiKey = `konsentrasi-${konsentrasi.id}`;
                                    const isKonsentrasiExpanded = !!expandedNodes[konsentrasiKey];
                                    const unitCount = konsentrasi.masterUnits?.length || 0;

                                    return (
                                      <div
                                        key={konsentrasi.id}
                                        className="rounded-xl border border-white/5 bg-slate-950/60 overflow-hidden"
                                      >
                                        <div
                                          className={`flex items-center justify-between p-3 cursor-pointer select-none transition-all ${
                                            isKonsentrasiExpanded ? "bg-neon-pink/[0.04]" : "hover:bg-white/[0.02]"
                                          }`}
                                          onClick={() => toggleNode(konsentrasiKey)}
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                toggleNode(konsentrasiKey);
                                              }}
                                              className="p-1 text-slate-400 hover:text-white transition-colors"
                                            >
                                              {isKonsentrasiExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                                            </button>

                                            <div className="p-1.5 rounded-lg bg-neon-pink/20 text-neon-pink border border-neon-pink/30">
                                              <BookOpen size={14} />
                                            </div>

                                            <div className="min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-bold text-white truncate">
                                                  {konsentrasi.name}
                                                </span>
                                                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-neon-pink/10 text-neon-pink border border-neon-pink/30 font-semibold">
                                                  Level 3 · Jurusan
                                                </span>
                                                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                                                  {unitCount} Unit SKKNI
                                                </span>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Level 3 Actions */}
                                          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenAddUnit(konsentrasi.id)}
                                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1 transition-all"
                                              title="Tambah Unit Kompetensi SKKNI"
                                            >
                                              <Plus size={12} /> Unit SKKNI
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditKonsentrasi(konsentrasi)}
                                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                                              title="Edit Nama Konsentrasi"
                                            >
                                              <Edit2 size={12} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDelete("konsentrasi", konsentrasi.id, konsentrasi.name)}
                                              className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                                              title="Hapus Konsentrasi Keahlian"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                        </div>

                                        {/* --- LEVEL 4: BANK MASTER UNIT KOMPETENSI SKKNI (FILES) --- */}
                                        {isKonsentrasiExpanded && (
                                          <div className="p-3 bg-slate-900/60 border-t border-white/5 space-y-2">
                                            {konsentrasi.masterUnits && konsentrasi.masterUnits.length > 0 ? (
                                              <div className="space-y-1.5">
                                                {konsentrasi.masterUnits.map((unit, idx) => (
                                                  <div
                                                    key={unit.id}
                                                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/[0.02] transition-all group/unit"
                                                  >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                      <span className="text-[10px] font-mono text-slate-500 w-5 text-center">
                                                        {idx + 1}
                                                      </span>
                                                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-500/30 font-bold shrink-0">
                                                        {unit.code}
                                                      </span>
                                                      <p className="text-xs font-medium text-slate-200 truncate">
                                                        {unit.title}
                                                      </p>
                                                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase shrink-0">
                                                        {unit.standard || "SKKNI"}
                                                      </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 shrink-0">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleOpenEditUnit(unit)}
                                                        className="p-1 text-slate-500 hover:text-white rounded hover:bg-white/10 transition-colors"
                                                        title="Edit Unit Kompetensi"
                                                      >
                                                        <Edit2 size={12} />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleDelete("units", unit.id, unit.title)}
                                                        className="p-1 text-slate-500 hover:text-red-400 rounded hover:bg-red-500/10 transition-colors"
                                                        title="Hapus Unit Kompetensi"
                                                      >
                                                        <Trash2 size={12} />
                                                      </button>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <div className="py-4 text-center border border-dashed border-white/10 rounded-xl">
                                                <p className="text-[11px] text-slate-400">
                                                  Belum ada Master Unit Kompetensi SKKNI pada jurusan ini.
                                                </p>
                                                <button
                                                  type="button"
                                                  onClick={() => handleOpenAddUnit(konsentrasi.id)}
                                                  className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                                                >
                                                  <Plus size={13} /> Tambah Unit Kompetensi Sekarang
                                                </button>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="p-3 text-[11px] text-slate-500 italic">
                                    Belum ada konsentrasi keahlian di bawah program ini.
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-[11px] text-slate-500 italic">
                        Belum ada program keahlian di bawah bidang ini.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* --- ADD / EDIT HIERARCHICAL MODAL --- */}
      {modalType && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {editingItem ? <Edit2 size={18} className="text-neon-purple" /> : <Plus size={18} className="text-neon-purple" />}
              {editingItem
                ? `Edit ${
                    modalType === "bidang"
                      ? "Bidang Keahlian"
                      : modalType === "program"
                      ? "Program Keahlian"
                      : modalType === "konsentrasi"
                      ? "Konsentrasi Keahlian"
                      : "Unit Kompetensi SKKNI"
                  }`
                : `Tambah ${
                    modalType === "bidang"
                      ? "Bidang Keahlian Baru"
                      : modalType === "program"
                      ? "Program Keahlian Baru"
                      : modalType === "konsentrasi"
                      ? "Konsentrasi Keahlian Baru"
                      : "Unit Kompetensi SKKNI Baru"
                  }`}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Lengkapi formulir di bawah ini untuk memperbarui direktori keahlian & master bank SKKNI.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* LEVEL 1: BIDANG */}
              {modalType === "bidang" && (
                <div>
                  <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                    Nama Bidang Keahlian <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Teknologi Informasi, Seni & Ekonomi Kreatif"
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-purple transition-all text-sm"
                    autoFocus
                  />
                </div>
              )}

              {/* LEVEL 2: PROGRAM */}
              {modalType === "program" && (
                <>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Induk Bidang Keahlian <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formBidangId}
                      onChange={(e) => setFormBidangId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-blue transition-all text-sm cursor-pointer"
                    >
                      {bidangList.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Nama Program Keahlian <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Pengembangan Perangkat Lunak dan Gim"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-blue transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </>
              )}

              {/* LEVEL 3: KONSENTRASI */}
              {modalType === "konsentrasi" && (
                <>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Induk Program Keahlian <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formProgramId}
                      onChange={(e) => setFormProgramId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-pink transition-all text-sm cursor-pointer"
                    >
                      {programList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.bidangKeahlian?.name || "Bidang"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Nama Konsentrasi Keahlian / Jurusan <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Contoh: Rekayasa Perangkat Lunak, Teknik Komputer Jaringan"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-pink transition-all text-sm"
                      autoFocus
                    />
                  </div>
                </>
              )}

              {/* LEVEL 4: MASTER UNIT SKKNI */}
              {modalType === "unit" && (
                <>
                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Jurusan / Konsentrasi Keahlian <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formKonsentrasiId}
                      onChange={(e) => setFormKonsentrasiId(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-emerald-400 transition-all text-sm cursor-pointer"
                    >
                      {konsentrasiList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.name} ({k.programKeahlian?.name || "Program"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                        Kode Unit SKKNI <span className="text-red-400">*</span>
                      </label>
                      <input
                        required
                        type="text"
                        value={formUnitCode}
                        onChange={(e) => setFormUnitCode(e.target.value)}
                        placeholder="Contoh: J.620100.004.01"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-400 transition-all text-sm"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                        Standar Kompetensi
                      </label>
                      <select
                        value={formUnitStandard}
                        onChange={(e) => setFormUnitStandard(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm cursor-pointer"
                      >
                        <option value="SKKNI">SKKNI (Standar Nasional)</option>
                        <option value="LSP">LSP (Lembaga Sertifikasi Profesi)</option>
                        <option value="IDUKA">IDUKA / Mitra Industri</option>
                        <option value="DUDI">DUDI (Dunia Usaha Dunia Industri)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Judul Unit Kompetensi <span className="text-red-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={formUnitTitle}
                      onChange={(e) => setFormUnitTitle(e.target.value)}
                      placeholder="Contoh: Membuat Dokumen Kode Program & Arsitektur Perangkat Lunak"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-emerald-400 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold tracking-widest text-slate-400 mb-2">
                      Nomor Urutan Tampil (Order)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formUnitOrder}
                      onChange={(e) => setFormUnitOrder(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-mono focus:outline-none focus:border-emerald-400 transition-all text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="flex-1 py-3.5 border border-white/10 text-white hover:bg-white/5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-gradient-to-r from-neon-purple to-neon-blue text-white rounded-2xl text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
