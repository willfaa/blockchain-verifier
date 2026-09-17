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
  FileText,
  ChevronRight,
  ChevronLeft,
  Search,
  FolderPlus,
  LayoutGrid,
  List as ListIcon,
  Home,
  ArrowUp,
  MoreVertical,
  ShieldCheck,
  Award,
  Sparkles,
  Info,
  Check,
  HardDrive,
  Copy,
  ExternalLink,
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

export default function WindowsExplorerExpertisePage() {
  const [loading, setLoading] = useState(true);

  // Raw Database Lists
  const [bidangList, setBidangList] = useState<Bidang[]>([]);
  const [programList, setProgramList] = useState<Program[]>([]);
  const [konsentrasiList, setKonsentrasiList] = useState<Konsentrasi[]>([]);
  const [unitsList, setUnitsList] = useState<MasterUnit[]>([]);

  // Navigation State (Current Directory Path)
  // currentPath: [] = Root (All Bidang), [bidangId] = Inside Bidang, [bidangId, programId] = Inside Program, [bidangId, programId, konsentrasiId] = Inside Jurusan
  const [selectedBidangId, setSelectedBidangId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedKonsentrasiId, setSelectedKonsentrasiId] = useState<string | null>(null);

  // Explorer UI State
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Modals State
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

      if (bidangRes.status === "fulfilled" && bidangRes.value.data.ok) {
        setBidangList(bidangRes.value.data.data || []);
      }
      if (programRes.status === "fulfilled" && programRes.value.data.ok) {
        setProgramList(programRes.value.data.data || []);
      }
      if (konsentrasiRes.status === "fulfilled" && konsentrasiRes.value.data.ok) {
        setKonsentrasiList(konsentrasiRes.value.data.data || []);
      }
      if (unitsRes.status === "fulfilled" && unitsRes.value.data.ok) {
        setUnitsList(unitsRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load expertise registry:", err);
      toast.error("Gagal memuat direktori keahlian.");
    } finally {
      setLoading(false);
    }
  };

  // Resolved Hierarchy Elements
  const currentBidang = useMemo(() => {
    return bidangList.find((b) => b.id === selectedBidangId) || null;
  }, [bidangList, selectedBidangId]);

  const currentProgram = useMemo(() => {
    return programList.find((p) => p.id === selectedProgramId) || null;
  }, [programList, selectedProgramId]);

  const currentKonsentrasi = useMemo(() => {
    return konsentrasiList.find((k) => k.id === selectedKonsentrasiId) || null;
  }, [konsentrasiList, selectedKonsentrasiId]);

  // Current Level Calculation: 0 = Root (Bidang), 1 = Inside Bidang (Programs), 2 = Inside Program (Konsentrasi), 3 = Inside Konsentrasi (Units)
  const currentLevel = useMemo(() => {
    if (selectedKonsentrasiId) return 3;
    if (selectedProgramId) return 2;
    if (selectedBidangId) return 1;
    return 0;
  }, [selectedBidangId, selectedProgramId, selectedKonsentrasiId]);

  // Items currently displayed in the main explorer pane
  const currentFolderItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    if (currentLevel === 0) {
      // Show Bidang folders
      return bidangList
        .filter((b) => !q || b.name.toLowerCase().includes(q))
        .map((b) => {
          const childPrograms = programList.filter((p) => p.bidangKeahlianId === b.id);
          const childKonsentrasiIds = childPrograms.flatMap((p) =>
            konsentrasiList.filter((k) => k.programKeahlianId === p.id).map((k) => k.id)
          );
          const totalUnits = unitsList.filter((u) => childKonsentrasiIds.includes(u.konsentrasiKeahlianId)).length;

          return {
            id: b.id,
            type: "bidang" as const,
            name: b.name,
            childCount: childPrograms.length,
            childLabel: `${childPrograms.length} Program`,
            totalUnits,
            raw: b,
          };
        });
    }

    if (currentLevel === 1) {
      // Show Program folders inside selected Bidang
      return programList
        .filter((p) => p.bidangKeahlianId === selectedBidangId && (!q || p.name.toLowerCase().includes(q)))
        .map((p) => {
          const childKonsentrasi = konsentrasiList.filter((k) => k.programKeahlianId === p.id);
          const totalUnits = unitsList.filter((u) =>
            childKonsentrasi.map((k) => k.id).includes(u.konsentrasiKeahlianId)
          ).length;

          return {
            id: p.id,
            type: "program" as const,
            name: p.name,
            childCount: childKonsentrasi.length,
            childLabel: `${childKonsentrasi.length} Jurusan`,
            totalUnits,
            raw: p,
          };
        });
    }

    if (currentLevel === 2) {
      // Show Konsentrasi / Jurusan folders inside selected Program
      return konsentrasiList
        .filter((k) => k.programKeahlianId === selectedProgramId && (!q || k.name.toLowerCase().includes(q)))
        .map((k) => {
          const childUnits = unitsList.filter((u) => u.konsentrasiKeahlianId === k.id);

          return {
            id: k.id,
            type: "konsentrasi" as const,
            name: k.name,
            childCount: childUnits.length,
            childLabel: `${childUnits.length} Unit SKKNI`,
            totalUnits: childUnits.length,
            raw: k,
          };
        });
    }

    if (currentLevel === 3) {
      // Show Master Units (Files) inside selected Konsentrasi
      return unitsList
        .filter(
          (u) =>
            u.konsentrasiKeahlianId === selectedKonsentrasiId &&
            (!q || u.code.toLowerCase().includes(q) || u.title.toLowerCase().includes(q) || u.standard.toLowerCase().includes(q))
        )
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((u) => ({
          id: u.id,
          type: "unit" as const,
          name: u.title,
          code: u.code,
          standard: u.standard,
          order: u.order,
          raw: u,
        }));
    }

    return [];
  }, [
    currentLevel,
    searchQuery,
    bidangList,
    programList,
    konsentrasiList,
    unitsList,
    selectedBidangId,
    selectedProgramId,
    selectedKonsentrasiId,
  ]);

  // Navigation Handlers
  const handleGoToRoot = () => {
    setSelectedBidangId(null);
    setSelectedProgramId(null);
    setSelectedKonsentrasiId(null);
    setSelectedItemId(null);
  };

  const handleGoToBidang = (bidangId: string) => {
    setSelectedBidangId(bidangId);
    setSelectedProgramId(null);
    setSelectedKonsentrasiId(null);
    setSelectedItemId(null);
  };

  const handleGoToProgram = (programId: string) => {
    const prog = programList.find((p) => p.id === programId);
    if (prog) setSelectedBidangId(prog.bidangKeahlianId);
    setSelectedProgramId(programId);
    setSelectedKonsentrasiId(null);
    setSelectedItemId(null);
  };

  const handleGoToKonsentrasi = (konsentrasiId: string) => {
    const kons = konsentrasiList.find((k) => k.id === konsentrasiId);
    if (kons) {
      setSelectedProgramId(kons.programKeahlianId);
      const prog = programList.find((p) => p.id === kons.programKeahlianId);
      if (prog) setSelectedBidangId(prog.bidangKeahlianId);
    }
    setSelectedKonsentrasiId(konsentrasiId);
    setSelectedItemId(null);
  };

  const handleNavigateUp = () => {
    if (currentLevel === 3) {
      setSelectedKonsentrasiId(null);
    } else if (currentLevel === 2) {
      setSelectedProgramId(null);
    } else if (currentLevel === 1) {
      setSelectedBidangId(null);
    }
    setSelectedItemId(null);
  };

  const handleOpenItem = (item: any) => {
    if (item.type === "bidang") {
      handleGoToBidang(item.id);
    } else if (item.type === "program") {
      handleGoToProgram(item.id);
    } else if (item.type === "konsentrasi") {
      handleGoToKonsentrasi(item.id);
    } else if (item.type === "unit") {
      handleOpenEditUnit(item.raw);
    }
  };

  // Modal Open Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    if (currentLevel === 0) {
      setFormName("");
      setModalType("bidang");
    } else if (currentLevel === 1) {
      setFormName("");
      setFormBidangId(selectedBidangId || "");
      setModalType("program");
    } else if (currentLevel === 2) {
      setFormName("");
      setFormProgramId(selectedProgramId || "");
      setModalType("konsentrasi");
    } else if (currentLevel === 3) {
      setFormUnitCode("");
      setFormUnitTitle("");
      setFormUnitStandard("SKKNI");
      setFormUnitOrder(currentFolderItems.length);
      setFormKonsentrasiId(selectedKonsentrasiId || "");
      setModalType("unit");
    }
  };

  const handleOpenEditItem = (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingItem(item.raw);

    if (item.type === "bidang") {
      setFormName(item.raw.name);
      setModalType("bidang");
    } else if (item.type === "program") {
      setFormName(item.raw.name);
      setFormBidangId(item.raw.bidangKeahlianId);
      setModalType("program");
    } else if (item.type === "konsentrasi") {
      setFormName(item.raw.name);
      setFormProgramId(item.raw.programKeahlianId);
      setModalType("konsentrasi");
    } else if (item.type === "unit") {
      setFormUnitCode(item.raw.code);
      setFormUnitTitle(item.raw.title);
      setFormUnitStandard(item.raw.standard || "SKKNI");
      setFormUnitOrder(item.raw.order || 0);
      setFormKonsentrasiId(item.raw.konsentrasiKeahlianId);
      setModalType("unit");
    }
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
  const handleDeleteItem = async (item: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    const typeLabel =
      item.type === "bidang"
        ? "Bidang Keahlian"
        : item.type === "program"
        ? "Program Keahlian"
        : item.type === "konsentrasi"
        ? "Konsentrasi Keahlian / Jurusan"
        : "Unit Kompetensi SKKNI";

    const apiEndpoint =
      item.type === "bidang"
        ? "bidang"
        : item.type === "program"
        ? "program"
        : item.type === "konsentrasi"
        ? "konsentrasi"
        : "units";

    if (
      !confirm(
        `Hapus ${typeLabel} "${item.name || item.code}"?\nSemua sub-item yang terkait di bawahnya juga akan terhapus secara otomatis.`
      )
    ) {
      return;
    }

    try {
      const res = await api.delete(`/admin/departments/${apiEndpoint}/${item.id}`);
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
          toast.success("Bidang Keahlian baru berhasil dibuat.");
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
          toast.success("Program Keahlian baru berhasil dibuat.");
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
          toast.success("Konsentrasi Keahlian baru berhasil dibuat.");
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
          toast.success("Unit Kompetensi SKKNI baru berhasil dibuat.");
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-24">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <HardDrive size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                Expertise <span className="text-cyan-400">Explorer</span>
                <span className="text-[10px] uppercase font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                  Drive & Explorer View
                </span>
              </h1>
              <p className="text-white/40 text-xs mt-1">
                Jelajahi dan kelola hierarki Bidang Keahlian, Program, Jurusan, dan Master Bank Unit SKKNI layaknya File Explorer.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={fetchData}
            className="p-3 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all hover:bg-white/10"
            title="Refresh Explorer"
          >
            <RefreshCw size={18} className={loading ? "animate-spin text-cyan-400" : ""} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-slate-950 font-extrabold px-6 py-3 rounded-2xl uppercase tracking-wider text-[11px] shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={16} />
            {currentLevel === 0
              ? "Tambah Bidang Keahlian"
              : currentLevel === 1
              ? "Tambah Program Keahlian"
              : currentLevel === 2
              ? "Tambah Jurusan / Konsentrasi"
              : "Tambah Unit SKKNI Baru"}
          </button>
        </div>
      </div>

      {/* --- EXPLORER MAIN WINDOW (SPLIT VIEW) --- */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col min-h-[680px]">
        {/* TOP TOOLBAR & ADDRESS BREADCRUMB BAR (WINDOWS EXPLORER / GDRIVE STYLE) */}
        <div className="p-3.5 border-b border-white/10 bg-slate-900/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Navigation Buttons + Breadcrumb Address Bar */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <button
              type="button"
              onClick={handleNavigateUp}
              disabled={currentLevel === 0}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
              title="Kembali ke folder induk (Up)"
            >
              <ArrowUp size={16} />
            </button>

            {/* Clickable Breadcrumbs Bar */}
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-950 border border-white/10 text-xs overflow-x-auto custom-scrollbar flex-1 whitespace-nowrap shadow-inner">
              <button
                type="button"
                onClick={handleGoToRoot}
                className={`flex items-center gap-1.5 font-bold transition-colors ${
                  currentLevel === 0 ? "text-cyan-400" : "text-slate-400 hover:text-white"
                }`}
              >
                <Home size={14} className="shrink-0" />
                <span>Root</span>
              </button>

              {currentBidang && (
                <>
                  <ChevronRight size={13} className="text-slate-600 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleGoToBidang(currentBidang.id)}
                    className={`font-bold truncate max-w-[180px] transition-colors ${
                      currentLevel === 1 ? "text-cyan-400" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {currentBidang.name}
                  </button>
                </>
              )}

              {currentProgram && (
                <>
                  <ChevronRight size={13} className="text-slate-600 shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleGoToProgram(currentProgram.id)}
                    className={`font-bold truncate max-w-[180px] transition-colors ${
                      currentLevel === 2 ? "text-cyan-400" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {currentProgram.name}
                  </button>
                </>
              )}

              {currentKonsentrasi && (
                <>
                  <ChevronRight size={13} className="text-slate-600 shrink-0" />
                  <span className="text-cyan-400 font-bold truncate max-w-[220px]">
                    {currentKonsentrasi.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Search Bar + View Mode Toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari dalam folder..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"
                }`}
                title="Grid / Tile View"
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-cyan-500/20 text-cyan-400" : "text-slate-400 hover:text-white"
                }`}
                title="List / Details View"
              >
                <ListIcon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-PANEL LAYOUT (LEFT SIDEBAR NAVIGATION TREE + RIGHT MAIN BROWSER AREA) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-[580px]">
          {/* LEFT SIDEBAR: QUICK DIRECTORY TREE */}
          <div className="w-full md:w-72 border-r border-white/10 bg-slate-950/90 p-4 space-y-4 shrink-0 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>Quick Access</span>
                <span className="text-[10px] font-mono text-cyan-400">{bidangList.length} Bidang</span>
              </div>

              {/* Tree Navigation List */}
              <div className="space-y-1 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                <button
                  type="button"
                  onClick={handleGoToRoot}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-left transition-all ${
                    currentLevel === 0
                      ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/10"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Home size={15} className={currentLevel === 0 ? "text-cyan-400" : "text-slate-500"} />
                  <span className="truncate">Semua Bidang Keahlian</span>
                </button>

                {bidangList.map((bidang) => {
                  const isBidangActive = selectedBidangId === bidang.id;
                  const childPrograms = programList.filter((p) => p.bidangKeahlianId === bidang.id);

                  return (
                    <div key={bidang.id} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => handleGoToBidang(bidang.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                          isBidangActive && currentLevel === 1
                            ? "bg-neon-purple/15 text-neon-purple border border-neon-purple/30 font-bold"
                            : isBidangActive
                            ? "text-neon-purple bg-white/[0.03]"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder size={14} className={isBidangActive ? "text-neon-purple" : "text-slate-500"} />
                          <span className="truncate">{bidang.name}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-white/5">
                          {childPrograms.length}
                        </span>
                      </button>

                      {/* Nested Programs in Left Tree if Bidang selected */}
                      {isBidangActive && childPrograms.length > 0 && (
                        <div className="pl-6 space-y-0.5 border-l border-white/10 ml-3 my-0.5">
                          {childPrograms.map((prog) => {
                            const isProgActive = selectedProgramId === prog.id;

                            return (
                              <button
                                key={prog.id}
                                type="button"
                                onClick={() => handleGoToProgram(prog.id)}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all ${
                                  isProgActive
                                    ? "bg-neon-blue/15 text-neon-blue border border-neon-blue/30 font-bold"
                                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                <Layers size={13} className={isProgActive ? "text-neon-blue" : "text-slate-500"} />
                                <span className="truncate">{prog.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Storage Summary Mini Card */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                <Sparkles size={12} className="text-cyan-400" />
                Statistik Registri
              </p>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                  <p className="text-xs font-mono font-bold text-white">{konsentrasiList.length}</p>
                  <p className="text-[9px] text-slate-400">Total Jurusan</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                  <p className="text-xs font-mono font-bold text-emerald-400">{unitsList.length}</p>
                  <p className="text-[9px] text-slate-400">Master SKKNI</p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT BROWSER AREA */}
          <div className="flex-1 p-6 flex flex-col justify-between bg-slate-950/40 min-h-[500px]">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw size={24} className="animate-spin text-cyan-400" />
                <p className="text-xs font-mono">Memuat item direktori...</p>
              </div>
            ) : currentFolderItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/10 text-slate-500">
                  <FolderOpen size={40} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Folder Ini Kosong</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {searchQuery
                      ? `Tidak ada item yang cocok dengan pencarian "${searchQuery}".`
                      : "Belum ada item di dalam folder ini. Klik tombol tambah di atas untuk membuat item baru."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAdd}
                  className="px-5 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <Plus size={14} /> Tambah Item Sekarang
                </button>
              </div>
            ) : viewMode === "grid" ? (
              /* --- GRID VIEW (CARDS / TILES LAYOUT) --- */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {currentFolderItems.map((item: any) => {
                  const isFolder = item.type !== "unit";
                  const isSelected = selectedItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItemId(item.id)}
                      onDoubleClick={() => handleOpenItem(item)}
                      className={`p-4 rounded-2xl border cursor-pointer select-none transition-all relative group flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-cyan-500/15 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90"
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenItem(item);
                            }}
                            className={`p-3 rounded-2xl transition-transform group-hover:scale-105 ${
                              item.type === "bidang"
                                ? "bg-neon-purple/20 text-neon-purple border border-neon-purple/30"
                                : item.type === "program"
                                ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                                : item.type === "konsentrasi"
                                ? "bg-neon-pink/20 text-neon-pink border border-neon-pink/30"
                                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {isFolder ? <Folder size={24} /> : <FileText size={24} />}
                          </div>

                          {/* Action Menu Buttons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditItem(item, e)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                              title="Edit / Rename"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteItem(item, e)}
                              className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Hapus"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Title & Metadata */}
                        <div>
                          {item.code && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold block w-fit mb-1">
                              {item.code}
                            </span>
                          )}
                          <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                            {item.name}
                          </h4>
                        </div>
                      </div>

                      {/* Footer Badge / Counter */}
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        {isFolder ? (
                          <>
                            <span>{item.childLabel}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenItem(item);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-0.5"
                            >
                              Buka <ChevronRight size={11} />
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="uppercase text-emerald-400">{item.standard || "SKKNI"}</span>
                            <span>Urutan #{item.order || 0}</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* --- LIST / DETAILS VIEW (TABLE LAYOUT) --- */
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Item / Unit</th>
                      <th className="py-3 px-4">Tipe / Kode</th>
                      <th className="py-3 px-4">Isi / Standar</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentFolderItems.map((item: any, idx: number) => {
                      const isFolder = item.type !== "unit";
                      const isSelected = selectedItemId === item.id;

                      return (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedItemId(item.id)}
                          onDoubleClick={() => handleOpenItem(item)}
                          className={`cursor-pointer transition-colors ${
                            isSelected ? "bg-cyan-500/[0.08]" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {isFolder ? (
                                <Folder
                                  size={16}
                                  className={
                                    item.type === "bidang"
                                      ? "text-neon-purple shrink-0"
                                      : item.type === "program"
                                      ? "text-neon-blue shrink-0"
                                      : "text-neon-pink shrink-0"
                                  }
                                />
                              ) : (
                                <FileText size={16} className="text-emerald-400 shrink-0" />
                              )}
                              <span className="font-bold text-white truncate max-w-md">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-300">
                            {item.code ? (
                              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold">
                                {item.code}
                              </span>
                            ) : (
                              <span className="uppercase text-[10px] text-slate-400">{item.type}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                            {isFolder ? item.childLabel : item.standard || "SKKNI"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              {isFolder && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenItem(item)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-bold transition-all flex items-center gap-1"
                                >
                                  Buka <ChevronRight size={11} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => handleOpenEditItem(item, e)}
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteItem(item, e)}
                                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Explorer Status Bar */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>
                Menampilkan <b>{currentFolderItems.length} item</b> di folder ini
              </span>
              <span>Double-click item untuk membuka folder</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {modalType && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              {editingItem ? <Edit2 size={18} className="text-cyan-400" /> : <Plus size={18} className="text-cyan-400" />}
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
              Lengkapi formulir di bawah ini untuk menyimpan data direktori keahlian.
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
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm"
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
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm cursor-pointer"
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
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm"
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
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm cursor-pointer"
                    >
                      {programList.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
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
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-cyan-400 transition-all text-sm"
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
                          {k.name}
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
                  className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg hover:shadow-xl transition-all"
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
