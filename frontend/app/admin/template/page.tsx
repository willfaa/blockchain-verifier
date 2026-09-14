"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getApiBase } from "@/lib/utils";
import {
  Save,
  Upload,
  ImageIcon,
  RefreshCw,
  FileText,
  X,
  Maximize2,
  Minimize2,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  UserCheck,
  PenTool,
  Check,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import CertificateEditor, {
  LayoutElement,
  CertificateLayoutConfig,
} from "@/components/features/CertificateEditor";
import CertificateTemplate from "@/components/features/CertificateTemplate";

export interface InstructorSetting {
  id: string;
  name: string;
  title: string;
  nip: string;
  signatureUrl?: string | null;
}

const PAPER_PRESETS: Record<
  string,
  { label: string; width: number; height: number; desc: string }
> = {
  A4: { label: "A4", width: 29.7, height: 21.0, desc: "21.0 × 29.7 cm" },
  F4: {
    label: "F4 / Folio",
    width: 33.0,
    height: 21.5,
    desc: "21.5 × 33.0 cm",
  },
  LETTER: {
    label: "US Letter",
    width: 27.94,
    height: 21.59,
    desc: "21.59 × 27.94 cm",
  },
};

// Helper URL yang akurat untuk file uploads
export const resolveUploadUrl = (
  path: string | null | undefined,
): string | null => {
  if (!path) return null;
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }
  const apiBase = getApiBase();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBase}${cleanPath}`;
};

export default function CertificateTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingTemplate, setRemovingTemplate] = useState(false);

  const [layout, setLayout] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [paperSize, setPaperSize] = useState<string>("A4");
  const [paperWidthCm, setPaperWidthCm] = useState<number>(29.7);
  const [paperHeightCm, setPaperHeightCm] = useState<number>(21.0);
  const [instructorName, setInstructorName] = useState("");
  const [instructorNip, setInstructorNip] = useState("");
  const [instructors, setInstructors] = useState<InstructorSetting[]>([
    {
      id: "signer1",
      name: "Drs. H. Mulyono, M.Pd.",
      title: "KEPALA SEKOLAH / PENGUJI INTERNAL",
      nip: "197204121998021003",
      signatureUrl: null,
    },
    {
      id: "signer2",
      name: "Ir. Hendra Kusuma, M.Kom.",
      title: "ASESOR MITRA INDUSTRI (DUDI)",
      nip: "PT. TELKOM INDONESIA TBK",
      signatureUrl: null,
    },
  ]);
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<
    CertificateLayoutConfig | Record<string, LayoutElement> | null
  >(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(100);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState<boolean>(false);
  const [fullscreenZoom, setFullscreenZoom] = useState<number>(100);

  const handleZoomIn = () => {
    setPreviewZoom((z) => Math.min(300, z + 15));
  };

  const handleZoomOut = () => {
    setPreviewZoom((z) => Math.max(30, z - 15));
  };

  const handleResetZoom = () => {
    setPreviewZoom(100);
  };

  const handleFullscreenZoomIn = () => {
    setFullscreenZoom((z) => Math.min(300, z + 15));
  };

  const handleFullscreenZoomOut = () => {
    setFullscreenZoom((z) => Math.max(30, z - 15));
  };

  const handleFullscreenResetZoom = () => {
    setFullscreenZoom(100);
  };

  const loadPreview = async () => {
    setPreviewError(false);
    try {
      const res = await api.get("/admin/settings/template-preview", {
        responseType: "blob",
        timeout: 3000,
      });
      if (res.data && res.data.type?.includes("image")) {
        const url = URL.createObjectURL(res.data);
        setPreviewBlobUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
      } else {
        setPreviewBlobUrl(null);
      }
    } catch (err) {
      // Gracefully switch to client vector renderer
      setPreviewBlobUrl(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadPreview();
    }
  }, [previewKey]);

  useEffect(() => {
    return () => {
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, detailsRes, configRes] = await Promise.all([
        api.get("/admin/settings"),
        api.get("/admin/settings/details"),
        api.get("/admin/settings/layout-config"),
      ]);

      if (settingsRes.data.ok && settingsRes.data.settings) {
        setLayout(settingsRes.data.settings.certificateLayout || "HORIZONTAL");
        const currentSize =
          settingsRes.data.settings.certificatePaperSize || "A4";
        setPaperSize(currentSize);
        setPaperWidthCm(
          settingsRes.data.settings.paperWidthCm ||
            (PAPER_PRESETS[currentSize]?.width ?? 29.7),
        );
        setPaperHeightCm(
          settingsRes.data.settings.paperHeightCm ||
            (PAPER_PRESETS[currentSize]?.height ?? 21.0),
        );
      }

      if (detailsRes.data.ok && detailsRes.data.data) {
        const dName = detailsRes.data.data.instructorName || "";
        const dNip = detailsRes.data.data.instructorNip || "";
        setInstructorName(dName);
        setInstructorNip(dNip);
        setBgPath(detailsRes.data.data.certificateTemplate);

        if (Array.isArray(detailsRes.data.data.instructors) && detailsRes.data.data.instructors.length > 0) {
          setInstructors(detailsRes.data.data.instructors);
        } else if (dName) {
          setInstructors([
            {
              id: "signer1",
              name: dName,
              title: "KEPALA SEKOLAH / PENGUJI INTERNAL",
              nip: dNip,
              signatureUrl: null,
            },
          ]);
        }
      }

      if (configRes.data.ok && configRes.data.config) {
        setLayoutConfig(configRes.data.config);
      }
      await loadPreview();
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat konfigurasi template sertifikat");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInstructorBox = () => {
    const nextIdx = instructors.length + 1;
    const newInstructor: InstructorSetting = {
      id: `signer${nextIdx}`,
      name: "",
      title: nextIdx === 2 ? "ASESOR MITRA INDUSTRI (DUDI)" : `ASESOR / PENANDATANGAN ${nextIdx}`,
      nip: "",
      signatureUrl: null,
    };
    setInstructors((prev) => [...prev, newInstructor]);
    toast.info(`Kotak Penandatangan ${nextIdx} ditambahkan.`);
  };

  const handleRemoveInstructorBox = (index: number) => {
    if (instructors.length <= 1) {
      toast.warning("Minimal harus ada 1 penandatangan utama");
      return;
    }
    setInstructors((prev) => prev.filter((_, i) => i !== index));
    toast.info("Penandatangan dihapus");
  };

  const handleUpdateInstructorField = (
    index: number,
    field: keyof InstructorSetting,
    value: string
  ) => {
    setInstructors((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const handleInstructorSignatureUpload = (
    index: number,
    file: File
  ) => {
    if (!file.type.includes("png") && !file.type.includes("webp") && !file.type.includes("image")) {
      toast.error("Harap unggah file gambar berformat PNG atau WebP transparan");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setInstructors((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index], signatureUrl: dataUrl };
        }
        return next;
      });

      // Update in layoutConfig directly if elements exist
      if (layoutConfig) {
        const hasElements = "elements" in layoutConfig ? (layoutConfig as any).elements : layoutConfig;
        if (hasElements) {
          const sigKey = index === 0 ? "instructorSignature" : `signer${index + 1}Signature`;
          if (hasElements[sigKey]) {
            hasElements[sigKey] = {
              ...hasElements[sigKey],
              imageUrl: dataUrl,
              visible: true,
            };
          }
        }
      }

      toast.success(`Tanda tangan PNG untuk Penandatangan ${index + 1} berhasil dipasang`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveInstructorSignature = (index: number) => {
    setInstructors((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], signatureUrl: null };
      }
      return next;
    });

    if (layoutConfig) {
      const hasElements = "elements" in layoutConfig ? (layoutConfig as any).elements : layoutConfig;
      if (hasElements) {
        const sigKey = index === 0 ? "instructorSignature" : `signer${index + 1}Signature`;
        if (hasElements[sigKey]) {
          hasElements[sigKey] = {
            ...hasElements[sigKey],
            imageUrl: "",
          };
        }
      }
    }

    toast.info("Tanda tangan dihapus");
  };

  const handleSaveAllInstructors = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const primaryName = instructors[0]?.name || instructorName;
      const primaryNip = instructors[0]?.nip || instructorNip;

      // 1. Simpan detail instruktur & daftar tanda tangan ke API settings
      const res = await api.post("/admin/settings/details", {
        instructorName: primaryName,
        instructorNip: primaryNip,
        instructors,
      });

      // 2. Sinkronisasi otomatis ke layoutConfig
      if (layoutConfig) {
        const hasElements = "elements" in layoutConfig ? (layoutConfig as any).elements : layoutConfig;
        if (hasElements) {
          instructors.forEach((inst, idx) => {
            const isFirst = idx === 0;
            const sigKey = isFirst ? "instructorSignature" : `signer${idx + 1}Signature`;
            const nameKey = isFirst ? "instructorName" : `signer${idx + 1}Name`;
            const titleKey = isFirst ? "instructorTitle" : `signer${idx + 1}Title`;
            const nipKey = isFirst ? "instructorNip" : `signer${idx + 1}Nip`;

            if (hasElements[sigKey]) {
              hasElements[sigKey] = {
                ...hasElements[sigKey],
                imageUrl: inst.signatureUrl || hasElements[sigKey].imageUrl || "",
                visible: true,
              };
            }
            if (hasElements[nameKey] && inst.name) {
              hasElements[nameKey] = {
                ...hasElements[nameKey],
                text: inst.name,
                visible: true,
              };
            }
            if (hasElements[titleKey] && inst.title) {
              hasElements[titleKey] = {
                ...hasElements[titleKey],
                text: inst.title,
                visible: true,
              };
            }
            if (hasElements[nipKey] && inst.nip) {
              hasElements[nipKey] = {
                ...hasElements[nipKey],
                text: inst.nip,
                visible: true,
              };
            }
          });

          await api.post("/admin/settings/layout-config", { config: layoutConfig });
        }
      }

      if (res.data.ok) {
        toast.success("Daftar penandatangan & tanda tangan digital berhasil disimpan!");
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan daftar penandatangan");
    } finally {
      setSaving(false);
    }
  };

  const handleOrientationChange = async (
    newLayout: "HORIZONTAL" | "VERTICAL",
  ) => {
    try {
      const res = await api.post("/admin/settings", {
        certificateLayout: newLayout,
      });
      if (res.data.ok) {
        setLayout(newLayout);
        toast.success(
          `Orientasi diubah ke ${newLayout === "HORIZONTAL" ? "Landscape (Horizontal)" : "Portrait (Vertikal)"}`,
        );
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengubah orientasi layout");
    }
  };

  const handlePresetSelect = async (presetKey: string) => {
    const preset = PAPER_PRESETS[presetKey];
    if (!preset) return;

    try {
      const res = await api.post("/admin/settings", {
        certificatePaperSize: presetKey,
        paperWidthCm: preset.width,
        paperHeightCm: preset.height,
      });
      if (res.data.ok) {
        setPaperSize(presetKey);
        setPaperWidthCm(preset.width);
        setPaperHeightCm(preset.height);
        toast.success(
          `Ukuran kertas diatur ke ${preset.label} (${preset.width} × ${preset.height} cm)`,
        );
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui ukuran kertas");
    }
  };

  const handleCustomDimensionsApply = async () => {
    try {
      const res = await api.post("/admin/settings", {
        certificatePaperSize: "CUSTOM",
        paperWidthCm: Number(paperWidthCm),
        paperHeightCm: Number(paperHeightCm),
      });
      if (res.data.ok) {
        setPaperSize("CUSTOM");
        toast.success(
          `Dimensi kustom disimpan: ${paperWidthCm} × ${paperHeightCm} cm`,
        );
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal memperbarui dimensi kustom");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Unggah gambar background langsung
      setUploading(true);
      const formData = new FormData();
      formData.append("certificateTemplate", file);

      try {
        const res = await api.post("/admin/settings/template", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data.ok) {
          toast.success("Background template berhasil diunggah");
          setBgPath(res.data.path);
          setPreviewKey(Date.now());
        }
      } catch (err) {
        console.error(err);
        toast.error("Gagal mengunggah gambar background");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleRemoveTemplate = async () => {
    setRemovingTemplate(true);
    try {
      const res = await api.delete("/admin/settings/template");
      if (res.data.ok) {
        toast.success("Background template dihapus. Kembali ke tema dasar.");
        setBgPath(null);
        setSelectedFile(null);
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus background template");
    } finally {
      setRemovingTemplate(false);
    }
  };

  const handleSaveConfig = async (config: CertificateLayoutConfig) => {
    setSavingConfig(true);
    try {
      const res = await api.post("/admin/settings/layout-config", { config });
      if (res.data.ok) {
        toast.success("Konfigurasi tata letak berhasil disimpan");
        setLayoutConfig(config);
        setPreviewKey(Date.now());
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 413) {
        toast.error("Ukuran data gambar terlalu besar. Silakan gunakan gambar dengan resolusi yang lebih efisien.");
      } else {
        toast.error(err.response?.data?.error || "Gagal menyimpan konfigurasi tata letak");
      }
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetConfig = async () => {
    if (
      !window.confirm(
        "Apakah Anda yakin ingin mereset layout ke pengaturan default? Semua posisi kustom dan layer tambahan akan dikembalikan.",
      )
    )
      return;
    setSavingConfig(true);
    try {
      const res = await api.delete("/admin/settings/layout-config");
      if (res.data.ok) {
        toast.success("Tata letak berhasil direset ke default");
        setLayoutConfig(null);
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal mereset konfigurasi tata letak");
    } finally {
      setSavingConfig(false);
    }
  };

  // Unduh Gambar Sertifikat Resolusi Penuh
  const handleDownloadCertificate = () => {
    if (!previewBlobUrl) {
      toast.error("Pratinjau sertifikat belum siap");
      return;
    }
    const a = document.createElement("a");
    a.href = previewBlobUrl;
    a.download = `Sertifikat-${paperSize}-${layout}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("Gambar sertifikat berhasil diunduh");
  };

  // Perhitungan aspect ratio container pratinjau
  const previewRatioW =
    layout === "VERTICAL"
      ? Math.min(paperWidthCm, paperHeightCm)
      : Math.max(paperWidthCm, paperHeightCm);
  const previewRatioH =
    layout === "VERTICAL"
      ? Math.max(paperWidthCm, paperHeightCm)
      : Math.min(paperWidthCm, paperHeightCm);

  const fullBgUrl = resolveUploadUrl(bgPath);

  if (loading) {
    return (
      <div className="text-teal-500 animate-pulse font-mono flex items-center gap-2">
        <span>&gt;</span> MEMUAT_KOMPONEN_TEMPLATE...
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      {/* Header Utama */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Pengaturan{" "}
            <span className="text-neon-purple">Template Sertifikat</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Konfigurasi dimensi kertas (cm), orientasi, template background,
            layer variabel, dan tanda tangan instruktur
          </p>
        </div>
        <button
          onClick={() => router.push("/admin/certificates")}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all text-xs font-bold uppercase tracking-wider"
        >
          Lihat Log Sertifikat
        </button>
      </div>

      {/* Grid Pengaturan — 2 Kolom: Dimensi & Template Background */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dimensi & Orientasi Kertas */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Maximize2 size={18} className="text-neon-blue" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Dimensi & Orientasi Kertas
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2.5 py-0.5 rounded-lg border border-neon-blue/20">
                {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm ({paperSize})
              </span>
            </div>

            {/* Pilihan Standar Presets */}
            <div className="space-y-3 mt-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Format Standar
              </p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(PAPER_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePresetSelect(key)}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                      paperSize === key
                        ? "bg-neon-blue text-white border-neon-blue shadow-[0_0_15px_#00e5ff]"
                        : "border-white/10 text-white/60 hover:border-white/30 bg-white/[0.02]"
                    }`}
                  >
                    {preset.label}
                    <span className="block text-[8px] mt-0.5 font-normal opacity-70">
                      {preset.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Orientasi Cetak */}
            <div className="space-y-2 mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Orientasi Layout
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleOrientationChange("HORIZONTAL")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
                    layout === "HORIZONTAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30 bg-white/[0.02]"
                  }`}
                >
                  <span>Landscape (Horizontal)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOrientationChange("VERTICAL")}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all text-center flex items-center justify-center gap-2 ${
                    layout === "VERTICAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30 bg-white/[0.02]"
                  }`}
                >
                  <span>Portrait (Vertikal)</span>
                </button>
              </div>
            </div>

            {/* Input Manual Float CM */}
            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Pengaturan Ukuran Manual (Float CM)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-bold block mb-1">
                    Lebar (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    value={paperWidthCm}
                    onChange={(e) => {
                      setPaperWidthCm(parseFloat(e.target.value) || 0);
                      setPaperSize("CUSTOM");
                    }}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-neon-blue"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-white/40 uppercase font-bold block mb-1">
                    Tinggi (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="10"
                    max="100"
                    value={paperHeightCm}
                    onChange={(e) => {
                      setPaperHeightCm(parseFloat(e.target.value) || 0);
                      setPaperSize("CUSTOM");
                    }}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-white font-mono font-bold text-xs focus:outline-none focus:border-neon-blue"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCustomDimensionsApply}
            className="w-full py-2.5 bg-neon-blue/15 hover:bg-neon-blue text-neon-blue hover:text-slate-950 border border-neon-blue/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Terapkan Dimensi
          </button>
        </div>

        {/* Template Background Image */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <ImageIcon size={18} className="text-cyan-400" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Template Background Sertifikat
                </h3>
              </div>
              {bgPath ? (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Kustom Aktif
                </span>
              ) : (
                <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2.5 py-0.5 rounded-lg border border-white/10">
                  Tema Vektor Dasar
                </span>
              )}
            </div>

            <div className="space-y-3 mt-4">
              <p className="text-white/60 text-xs leading-relaxed">
                Unggah desain sertifikat yang sudah jadi dari Corel/Canva/Illustrator (PNG/JPG resolusi tinggi). Anda dapat mengatur posisi QR dan teks dinamis secara presisi di canvas bawah.
              </p>

              <div className="mt-4 p-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] flex flex-col items-center justify-center text-center gap-3">
                <input
                  type="file"
                  id="bgUploadInput"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("bgUploadInput")?.click()}
                  disabled={uploading}
                  className="px-4 py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
                >
                  <Upload size={14} />
                  <span>{uploading ? "Mengunggah Background..." : "Pilih Berkas Background"}</span>
                </button>
                <p className="text-[10px] text-white/40">
                  Mendukung file PNG / JPG hingga 10MB
                </p>
              </div>

              {bgPath && (
                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <ImageIcon size={16} className="text-cyan-400 shrink-0" />
                    <span className="text-xs text-white/80 font-mono truncate">
                      {bgPath.split("/").pop()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveTemplate}
                    disabled={removingTemplate}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Hapus gambar background"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] text-white/50">
            💡 Tips: Anda juga bisa menambahkan ornamen dan logo langsung di <b>Editor Tata Letak Interaktif</b> di bawah.
          </div>
        </div>
      </div>

      {/* Bagian Khusus: Daftar Penandatangan & Tanda Tangan Digital (Multi-Signer & PNG) */}
      <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-neon-purple">
                <UserCheck size={18} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Daftar Penandatangan & Tanda Tangan Digital
              </h2>
              <span className="text-[10px] font-mono text-neon-purple bg-neon-purple/10 px-2.5 py-0.5 rounded-lg border border-neon-purple/30 font-bold">
                {instructors.length} Penandatangan
              </span>
            </div>
            <p className="text-white/40 text-xs">
              Tambahkan instruktur / asesor penguji dan unggah tanda tangan PNG transparan agar otomatis tampil pada sertifikat.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={handleAddInstructorBox}
              className="px-3.5 py-2 bg-neon-purple/15 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <Plus size={14} />
              <span>Tambah Penandatangan</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAllInstructors()}
              disabled={saving}
              className="px-4 py-2 bg-neon-purple hover:bg-neon-purple/90 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-neon-purple/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save size={14} />
              <span>{saving ? "Menyimpan..." : "Simpan Penandatangan"}</span>
            </button>
          </div>
        </div>

        {/* Grid Added Boxes untuk Setiap Penandatangan */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {instructors.map((inst, idx) => {
            const isFirst = idx === 0;
            const isSecond = idx === 1;
            const fileInputId = `signature_upload_input_${inst.id || idx}`;

            return (
              <div
                key={inst.id || `signer_${idx}`}
                className="glass-panel p-4 sm:p-5 rounded-2xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between space-y-4 relative group"
              >
                {/* Header Card Box */}
                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-900 border border-white/15 text-[10px] font-bold text-white/90 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {isFirst
                        ? "Penandatangan 1 (Utama)"
                        : isSecond
                        ? "Penandatangan 2 (Mitra DUDI)"
                        : `Penandatangan ${idx + 1}`}
                    </span>
                  </div>

                  {instructors.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveInstructorBox(idx)}
                      className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                      title={`Hapus Penandatangan ${idx + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Form Input Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                      Nama Lengkap & Gelar
                    </label>
                    <input
                      type="text"
                      value={inst.name}
                      onChange={(e) =>
                        handleUpdateInstructorField(idx, "name", e.target.value)
                      }
                      placeholder={
                        isFirst
                          ? "contoh: Dr. Budi Santoso, M.T."
                          : "contoh: Ir. Hendra Kusuma, M.Kom."
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-white font-semibold text-xs focus:outline-none focus:border-neon-purple/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                      Jabatan / Peran
                    </label>
                    <input
                      type="text"
                      value={inst.title}
                      onChange={(e) =>
                        handleUpdateInstructorField(idx, "title", e.target.value)
                      }
                      placeholder={
                        isFirst
                          ? "contoh: KEPALA SEKOLAH / PENGUJI INTERNAL"
                          : "contoh: ASESOR MITRA INDUSTRI (DUDI)"
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:outline-none focus:border-neon-purple/50 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">
                      NIP / ID Registrasi / Instansi
                    </label>
                    <input
                      type="text"
                      value={inst.nip}
                      onChange={(e) =>
                        handleUpdateInstructorField(idx, "nip", e.target.value)
                      }
                      placeholder={
                        isFirst
                          ? "contoh: 197204121998021003"
                          : "contoh: PT. TELKOM INDONESIA TBK"
                      }
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-2.5 text-white font-mono text-xs focus:outline-none focus:border-neon-purple/50 transition-all"
                    />
                  </div>

                  {/* Tanda Tangan Digital Area */}
                  <div className="pt-2 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                        <PenTool size={12} className="text-cyan-400" />
                        <span>Tanda Tangan PNG</span>
                      </label>
                      {inst.signatureUrl && (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <Check size={10} /> PNG Terpasang
                        </span>
                      )}
                    </div>

                    <input
                      type="file"
                      id={fileInputId}
                      accept="image/png, image/webp"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleInstructorSignatureUpload(idx, e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {inst.signatureUrl ? (
                      <div className="p-2.5 rounded-xl bg-slate-950/80 border border-white/10 flex flex-col items-center justify-center gap-2">
                        {/* Checkerboard Pattern Container for Transparency */}
                        <div
                          className="w-full h-16 rounded-lg flex items-center justify-center p-1.5 overflow-hidden border border-white/5"
                          style={{
                            backgroundImage:
                              "linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)",
                            backgroundSize: "16px 16px",
                            backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
                          }}
                        >
                          <img
                            src={inst.signatureUrl}
                            alt={`TTD ${inst.name}`}
                            className="max-h-full max-w-full object-contain filter drop-shadow-[0_0_8px_rgba(0,229,255,0.3)]"
                          />
                        </div>

                        <div className="flex items-center gap-2 w-full pt-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              document.getElementById(fileInputId)?.click()
                            }
                            className="flex-1 py-1.5 px-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider border border-white/10 transition-colors flex items-center justify-center gap-1"
                          >
                            <Upload size={11} />
                            <span>Ganti PNG</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveInstructorSignature(idx)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 transition-colors"
                            title="Hapus Tanda Tangan"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          document.getElementById(fileInputId)?.click()
                        }
                        className="py-3 px-3 rounded-xl border border-dashed border-white/15 hover:border-cyan-400/40 bg-white/[0.02] hover:bg-cyan-500/[0.03] cursor-pointer flex items-center justify-center gap-2.5 transition-all group/upload"
                      >
                        <div className="p-1.5 rounded-lg bg-white/5 group-hover/upload:bg-cyan-500/10 text-white/40 group-hover/upload:text-cyan-400 transition-colors">
                          <Upload size={13} />
                        </div>
                        <div className="text-left">
                          <p className="text-[11px] font-semibold text-white/80 group-hover/upload:text-cyan-300">
                            Pilih File PNG TTD
                          </p>
                          <p className="text-[9px] text-white/30">
                            Disarankan format PNG transparan
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Tata Letak Visual */}
      <div className="mt-12 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Editor Tata Letak Interaktif
          </h2>
          <p className="text-white/40 text-xs mt-2">
            Klik tunggal untuk memilih, geser untuk memindahkan, tombol panah
            untuk pergeseran presisi, dan sesuaikan warna dasar canvas kanvas.
          </p>
        </div>

        <div className="w-full">
          <CertificateEditor
            initialConfig={layoutConfig}
            paperSize={paperSize}
            paperWidthCm={paperWidthCm}
            paperHeightCm={paperHeightCm}
            layout={layout}
            bgPath={fullBgUrl}
            onSave={handleSaveConfig}
            onReset={handleResetConfig}
            isSaving={savingConfig}
          />
        </div>
      </div>

      {/* Pratinjau Output Akhir & Fitur Unduh PNG */}
      <div className="mt-12 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Pratinjau Output Akhir (Server Render)
            </h2>
            <p className="text-white/40 text-xs mt-2">
              Gambar hasil render resmi dari server yang dibatasi tepat sesuai
              kanvas sertifikat. Gunakan kontrol zoom atau tombol layar penuh
              untuk inspeksi detail tanpa terpotong.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadCertificate}
              disabled={!previewBlobUrl}
              className="flex items-center gap-2 px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-2xl transition-all shadow-lg shadow-cyan-500/20 font-bold text-xs uppercase tracking-wider disabled:opacity-40"
              title="Unduh File Gambar PNG Resmi (150 DPI)"
            >
              <Download size={16} />
              <span>Unduh PNG</span>
            </button>

            <button
              onClick={() => setPreviewKey(Date.now())}
              className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded-2xl transition-all group"
              title="Segarkan Pratinjau"
            >
              <RefreshCw size={16} className="group-hover:animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:inline">
                Segarkan
              </span>
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 sm:p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl flex flex-col items-center">
          {/* Header Panel Preview dengan Kontrol Zoom & Info Dimensi */}
          <div className="flex flex-wrap items-center justify-between w-full mb-6 gap-3 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-white/80 text-xs uppercase tracking-widest">
                Hasil Render Sertifikat
              </h3>
              <span className="text-[10px] font-mono text-cyan-400/80 bg-cyan-950/40 px-3 py-1 rounded-lg border border-cyan-500/20">
                {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm (
                {paperSize}) ·{" "}
                {layout === "HORIZONTAL" ? "Landscape" : "Portrait"}
              </span>
            </div>

            {/* Toolbar Zoom & Layar Penuh */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-white/60 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors"
                  title="Perkecil Pratinjau (Zoom Out)"
                >
                  <ZoomOut size={15} />
                </button>
                <span className="text-xs font-mono text-white/90 w-12 text-center select-none font-semibold">
                  {previewZoom}%
                </span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-white/60 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors"
                  title="Perbesar Pratinjau (Zoom In)"
                >
                  <ZoomIn size={15} />
                </button>
                <div className="w-px h-4 bg-white/15 mx-1" />
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1 text-white/60 hover:text-cyan-400 hover:bg-white/10 rounded-lg transition-colors"
                  title="Reset Ukuran (100% Fit)"
                >
                  <RotateCcw size={13} />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFullscreenZoom(100);
                  setIsFullscreenPreview(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold transition-colors"
                title="Buka Pratinjau Layar Penuh (Fullscreen Modal)"
              >
                <Maximize2 size={14} className="text-cyan-400" />
                <span className="hidden sm:inline">Layar Penuh</span>
              </button>
            </div>
          </div>

          {/* Area Viewport Scrollable & Zoomable (Tidak akan terpotong halaman) */}
          <div
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                  setPreviewZoom((z) => Math.min(300, z + 10));
                } else {
                  setPreviewZoom((z) => Math.max(30, z - 10));
                }
              }
            }}
            className="w-full max-h-[640px] min-h-[380px] bg-slate-950/80 rounded-2xl border border-white/10 p-6 overflow-auto custom-scrollbar flex items-center justify-center relative shadow-inner"
          >
            {previewBlobUrl ? (
              <div
                style={{
                  width: `${previewZoom}%`,
                  maxWidth: "none",
                  transition: "width 0.12s ease-out",
                }}
                className="flex items-center justify-center shrink-0 m-auto"
              >
                <img
                  src={previewBlobUrl}
                  alt="Pratinjau Sertifikat"
                  className="w-full h-auto object-contain rounded-lg shadow-2xl border border-white/10 select-none animate-in fade-in duration-300"
                />
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${previewZoom / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.12s ease-out",
                }}
                className="flex items-center justify-center shrink-0 m-auto"
              >
                <CertificateTemplate
                  studentName="John Doe"
                  studentId="2024150042"
                  courseName="Blockchain & Distributed Systems"
                  majority="Teknik Informatika"
                  program="Rekayasa Perangkat Lunak"
                  instructorName={instructorName}
                  instructorNip={instructorNip}
                  layout={layout}
                  paperSize={paperSize}
                  paperWidthCm={paperWidthCm}
                  paperHeightCm={paperHeightCm}
                  bgPath={bgPath}
                  layoutConfig={layoutConfig}
                />
              </div>
            )}
          </div>

          <div className="w-full flex items-center justify-between text-[11px] text-white/40 mt-3 px-1">
            <span>💡 Tekan <b>Ctrl + Scroll Mouse</b> di atas gambar untuk zoom cepat.</span>
            <span>Skala saat ini: <b>{previewZoom}%</b></span>
          </div>
        </div>
      </div>

      {/* Modal Lightbox Layar Penuh (Fullscreen Preview Modal) */}
      {isFullscreenPreview && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsFullscreenPreview(false)}
        >
          {/* Header Lightbox */}
          <div
            className="flex items-center justify-between w-full pb-4 border-b border-white/10 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-white tracking-tight">
                Inspeksi Resolusi Penuh Sertifikat
              </h3>
              <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-500/30">
                {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm ({paperSize})
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Zoom Controls di Fullscreen */}
              <div className="flex items-center gap-1 bg-slate-900 px-3 py-1.5 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={handleFullscreenZoomOut}
                  className="p-1 text-white/60 hover:text-cyan-400 rounded-lg"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <span className="text-xs font-mono text-white/90 w-14 text-center font-bold">
                  {fullscreenZoom}%
                </span>
                <button
                  type="button"
                  onClick={handleFullscreenZoomIn}
                  className="p-1 text-white/60 hover:text-cyan-400 rounded-lg"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button
                  type="button"
                  onClick={handleFullscreenResetZoom}
                  className="p-1 text-white/60 hover:text-cyan-400 rounded-lg"
                  title="Reset 100%"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              <button
                onClick={handleDownloadCertificate}
                disabled={!previewBlobUrl}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20"
                title="Unduh Gambar PNG"
              >
                <Download size={15} />
                <span className="hidden sm:inline">Unduh PNG</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
                title="Tutup Layar Penuh (Esc)"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Area Gambar Fullscreen dengan scroll bebas */}
          <div
            className="flex-1 w-full overflow-auto custom-scrollbar flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsFullscreenPreview(false);
              }
            }}
            onWheel={(e) => {
              if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                  setFullscreenZoom((z) => Math.min(300, z + 10));
                } else {
                  setFullscreenZoom((z) => Math.max(30, z - 10));
                }
              }
            }}
          >
            {previewBlobUrl ? (
              <div
                style={{
                  width: `${fullscreenZoom}%`,
                  maxWidth: "none",
                  transition: "width 0.12s ease-out",
                }}
                className="flex items-center justify-center shrink-0 m-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={previewBlobUrl}
                  alt="Pratinjau Sertifikat Layar Penuh"
                  className="w-full h-auto object-contain rounded-xl shadow-2xl border border-white/15"
                />
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${fullscreenZoom / 100})`,
                  transformOrigin: "center center",
                  transition: "transform 0.12s ease-out",
                }}
                className="flex items-center justify-center shrink-0 m-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <CertificateTemplate
                  studentName="John Doe"
                  studentId="2024150042"
                  courseName="Blockchain & Distributed Systems"
                  majority="Teknik Informatika"
                  program="Rekayasa Perangkat Lunak"
                  instructorName={instructorName}
                  instructorNip={instructorNip}
                  layout={layout}
                  paperSize={paperSize}
                  paperWidthCm={paperWidthCm}
                  paperHeightCm={paperHeightCm}
                  bgPath={bgPath}
                  layoutConfig={layoutConfig}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
