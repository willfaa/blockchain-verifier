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
  Download,
} from "lucide-react";
import { toast } from "sonner";
import CertificateEditor, {
  LayoutElement,
  CertificateLayoutConfig,
} from "@/components/features/CertificateEditor";

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
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<
    CertificateLayoutConfig | Record<string, LayoutElement> | null
  >(null);
  const [savingConfig, setSavingConfig] = useState(false);

  const loadPreview = async () => {
    setPreviewError(false);
    try {
      const res = await api.get("/admin/settings/template-preview", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error("Gagal memuat pratinjau sertifikat:", err);
      setPreviewError(true);
      toast.error("Gagal memuat gambar pratinjau sertifikat dari server");
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
        setInstructorName(detailsRes.data.data.instructorName);
        setInstructorNip(detailsRes.data.data.instructorNip);
        setBgPath(detailsRes.data.data.certificateTemplate);
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

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post("/admin/settings/details", {
        instructorName,
        instructorNip,
      });
      if (res.data.ok) {
        toast.success("Detail instruktur berhasil diperbarui");
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan detail instruktur");
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

      {/* Grid Pengaturan — 3 Kolom Responsif */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dimensi Kertas (Float CM) */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Maximize2 size={18} className="text-neon-blue" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Dimensi Kertas (CM)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-neon-blue bg-neon-blue/10 px-2.5 py-0.5 rounded-lg border border-neon-blue/20">
                {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm
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
            className="mt-4 w-full py-2.5 bg-neon-blue/15 hover:bg-neon-blue text-neon-blue hover:text-slate-950 border border-neon-blue/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
          >
            Terapkan Dimensi
          </button>
        </div>

        {/* Orientasi Cetak */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <FileText size={18} className="text-neon-pink" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Orientasi Cetak
              </h3>
            </div>
            <div className="space-y-3 mt-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Orientasi Layout ({paperSize})
              </p>
              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => handleOrientationChange("HORIZONTAL")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 text-left flex items-center justify-between ${
                    layout === "HORIZONTAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  <span>Horizontal (Landscape)</span>
                  <span className="text-[10px] opacity-70">29.7 × 21.0</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOrientationChange("VERTICAL")}
                  className={`py-3 px-4 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 text-left flex items-center justify-between ${
                    layout === "VERTICAL"
                      ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                      : "border-white/10 text-white/60 hover:border-white/30"
                  }`}
                >
                  <span>Vertikal (Portrait)</span>
                  <span className="text-[10px] opacity-70">21.0 × 29.7</span>
                </button>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-[11px] text-white/50 mt-4">
            💡 Tambahkan gambar background, ornamen, atau tanda tangan langsung di <b>Editor Tata Letak</b> di bawah.
          </div>
        </div>

        {/* Detail Instruktur Global */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl">
          <form
            onSubmit={handleSaveDetails}
            className="space-y-4 h-full flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                <Save size={18} className="text-neon-purple" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Detail Instruktur (Global)
                </h3>
              </div>

              <div className="space-y-3 mt-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                    Nama Kepala Instruktur / Dekan
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="contoh: Dr. Budi Santoso, M.T."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                    NIP / ID Registrasi Instruktur
                  </label>
                  <input
                    type="text"
                    value={instructorNip}
                    onChange={(e) => setInstructorNip(e.target.value)}
                    placeholder="contoh: 198706152010121002"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-neon-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 mt-4"
            >
              {saving ? "Menyimpan Detail..." : "Simpan Detail Instruktur"}
            </button>
          </form>
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
              kanvas sertifikat.
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

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest">
              Hasil Render Sertifikat
            </h3>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/5">
              {paperWidthCm.toFixed(1)} × {paperHeightCm.toFixed(1)} cm (
              {paperSize}) ·{" "}
              {layout === "HORIZONTAL" ? "Landscape" : "Portrait"}
            </span>
          </div>

          <div
            style={{ aspectRatio: `${previewRatioW} / ${previewRatioH}` }}
            className="group relative w-full border border-white/5 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner max-w-3xl transition-all duration-500"
          >
            {previewBlobUrl ? (
              <img
                src={previewBlobUrl}
                alt="Pratinjau Sertifikat"
                className="max-h-full max-w-full object-contain animate-in fade-in duration-300"
              />
            ) : previewError ? (
              <div className="text-red-500 text-xs font-mono">
                GAGAL_MEMUAT_PRATINJAU
              </div>
            ) : (
              <div className="text-white/20 animate-pulse text-xs font-mono uppercase tracking-widest">
                MEMBUAT_PRATINJAU...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
