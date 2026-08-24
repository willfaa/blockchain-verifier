"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Save, Upload, ImageIcon, RefreshCw, FileText, X, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import CertificateEditor, { LayoutElement } from "@/components/features/CertificateEditor";

export default function CertificateTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingTemplate, setRemovingTemplate] = useState(false);
  
  const [layout, setLayout] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [paperSize, setPaperSize] = useState<"A4" | "F4">("A4");
  const [instructorName, setInstructorName] = useState("");
  const [instructorNip, setInstructorNip] = useState("");
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<Record<string, LayoutElement> | null>(null);
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
      console.error("Failed to load certificate template preview:", err);
      setPreviewError(true);
      toast.error("Failed to load certificate preview image from API");
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
        api.get("/admin/settings/layout-config")
      ]);

      if (settingsRes.data.ok && settingsRes.data.settings) {
        setLayout(settingsRes.data.settings.certificateLayout);
        setPaperSize(settingsRes.data.settings.certificatePaperSize || "A4");
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
      toast.error("Failed to load certificate template configurations");
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
        toast.success("Instructor details updated successfully");
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save instructor details");
    } finally {
      setSaving(false);
    }
  };

  const handleOrientationChange = async (newLayout: "HORIZONTAL" | "VERTICAL") => {
    try {
      const res = await api.post("/admin/settings", { certificateLayout: newLayout });
      if (res.data.ok) {
        setLayout(newLayout);
        toast.success(`Orientation updated to ${newLayout.toLowerCase()}`);
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update layout orientation");
    }
  };

  const handlePaperSizeChange = async (newSize: "A4" | "F4") => {
    try {
      const res = await api.post("/admin/settings", { certificatePaperSize: newSize });
      if (res.data.ok) {
        setPaperSize(newSize);
        toast.success(`Paper size updated to ${newSize}`);
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update paper size");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      // Perform upload immediately
      setUploading(true);
      const formData = new FormData();
      formData.append("certificateTemplate", file);

      try {
        const res = await api.post("/admin/settings/template", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data.ok) {
          toast.success("Template background updated");
          setBgPath(res.data.path);
          // Synchronize real-time layout preview after upload
          setPreviewKey(Date.now());
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to upload template background image");
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
        toast.success("Template removed. Reverted to procedural theme.");
        setBgPath(null);
        setSelectedFile(null);
        // Synchronize real-time layout preview after removal
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove template background");
    } finally {
      setRemovingTemplate(false);
    }
  };

  const handleSaveConfig = async (config: Record<string, LayoutElement>) => {
    setSavingConfig(true);
    try {
      const res = await api.post("/admin/settings/layout-config", { config });
      if (res.data.ok) {
        toast.success("Layout configuration saved");
        setLayoutConfig(config);
        setPreviewKey(Date.now()); // Update actual preview image
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to save layout configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleResetConfig = async () => {
    if (!window.confirm("Are you sure you want to reset the layout to defaults? All custom positions will be lost.")) return;
    setSavingConfig(true);
    try {
      const res = await api.delete("/admin/settings/layout-config");
      if (res.data.ok) {
        toast.success("Layout reset to defaults");
        setLayoutConfig(null);
        setPreviewKey(Date.now());
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset layout configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  // Compute the preview container aspect ratio based on paper size and orientation
  const getPreviewAspect = () => {
    if (paperSize === "F4") {
      return layout === "HORIZONTAL" ? "aspect-[1953/1272]" : "aspect-[1272/1953]";
    }
    // A4
    return layout === "HORIZONTAL" ? "aspect-[1754/1240]" : "aspect-[1240/1754]";
  };

  if (loading) {
    return (
      <div className="text-teal-500 animate-pulse font-mono flex items-center gap-2">
        <span>&gt;</span> MONITORING_TEMPLATE_COMPONENTS...
      </div>
    );
  }



  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Certificate <span className="text-neon-purple">Template Settings</span>
          </h1>
          <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-4">
            Configure default certificate layouts, metadata overlays, and head instructor signatures
          </p>
        </div>
        <button
          onClick={() => setPreviewKey(Date.now())}
          className="p-4 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-2xl transition-all"
          title="Refresh Template Preview"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Settings Grid — 2×2 compact arrangement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Paper Size */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Maximize2 size={18} className="text-neon-blue" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Paper Size
            </h3>
          </div>
          <div className="space-y-3 mt-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Certificate Paper Size Format
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handlePaperSizeChange("A4")}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  paperSize === "A4"
                    ? "bg-neon-blue text-white border-neon-blue shadow-[0_0_15px_#00e5ff]"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                A4 <span className="block text-[9px] mt-0.5 font-normal opacity-70">210 × 297 mm</span>
              </button>
              <button
                type="button"
                onClick={() => handlePaperSizeChange("F4")}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  paperSize === "F4"
                    ? "bg-neon-blue text-white border-neon-blue shadow-[0_0_15px_#00e5ff]"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                F4 <span className="block text-[9px] mt-0.5 font-normal opacity-70">215 × 330 mm</span>
              </button>
            </div>
          </div>
        </div>

        {/* Print Orientation */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FileText size={18} className="text-neon-pink" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Print Orientation
            </h3>
          </div>
          <div className="space-y-3 mt-4">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Certificate Layout ({paperSize})
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOrientationChange("HORIZONTAL")}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  layout === "HORIZONTAL"
                    ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                Horizontal
              </button>
              <button
                type="button"
                onClick={() => handleOrientationChange("VERTICAL")}
                className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  layout === "VERTICAL"
                    ? "bg-neon-pink text-white border-neon-pink shadow-[0_0_15px_#ff4081]"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                Vertical
              </button>
            </div>
          </div>
        </div>

        {/* Default Background Template */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <ImageIcon size={18} className="text-neon-blue" />
            <h3 className="font-bold text-white text-xs uppercase tracking-widest">
              Default Background Template
            </h3>
          </div>
          <div className="mt-4 space-y-3">
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
              Upload Default Certificate Background
            </p>

            <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-white/20 transition-all">
              {bgPath ? (
                <div className="text-center p-4">
                  {/* Close/Cancel button - top right */}
                  <button
                    onClick={handleRemoveTemplate}
                    disabled={removingTemplate}
                    className="absolute top-3 right-3 z-20 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl border border-red-400/30 shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 group"
                    title="Remove uploaded template and revert to mock data"
                  >
                    <X size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                  <p className="text-xs text-white/60 font-semibold break-all mb-2">
                    Template Loaded:
                  </p>
                  <p className="text-[10px] text-teal-400 font-mono select-all">
                    {bgPath}
                  </p>
                </div>
              ) : (
                <div className="text-white/20 flex flex-col items-center">
                  <ImageIcon size={40} className="mb-3" />
                  <span className="text-[10px] uppercase font-bold tracking-widest">
                    Using Procedural Theme
                  </span>
                </div>
              )}

              <div className="absolute inset-0 bg-slate-950/90 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer px-6 py-3.5 bg-white text-black hover:bg-neon-blue hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all">
                  {uploading ? "Uploading..." : "Upload New File"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Details */}
        <div className="glass-panel p-6 rounded-3xl border-transparent shadow-xl">
          <form onSubmit={handleSaveDetails} className="space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Save size={18} className="text-neon-purple" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Instructor Details (Global)
              </h3>
            </div>

            <div className="space-y-3 flex-1 mt-2">
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Head Instructor / Principal Name
                </label>
                <input
                  type="text"
                  value={instructorName}
                  onChange={(e) => setInstructorName(e.target.value)}
                  placeholder="e.g. Budi Headmaster, M.T."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Instructor ID / Registration ID
                </label>
                <input
                  type="text"
                  value={instructorNip}
                  onChange={(e) => setInstructorNip(e.target.value)}
                  placeholder="e.g. 198706152010121002"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-neon-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
            >
              {saving ? "Saving Details..." : "Save Instructor Details"}
            </button>
          </form>
        </div>

      </div>

      {/* Visual Editor Section */}
      <div className="mt-12 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Interactive Layout Editor</h2>
          <p className="text-white/40 text-xs mt-2">Drag and drop elements, resize boxes, and customize typography.</p>
        </div>

        <div className="w-full">
          <CertificateEditor
            initialConfig={layoutConfig}
            paperSize={paperSize}
            layout={layout}
            bgPath={bgPath ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/uploads/${bgPath.split('/').pop()}` : null}
            onSave={handleSaveConfig}
            onReset={handleResetConfig}
            isSaving={savingConfig}
          />
        </div>
      </div>

      {/* Final Preview Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Final Output Preview</h2>
            <p className="text-white/40 text-xs mt-2">This is the exact image that will be rendered by the server.</p>
          </div>
          <button
            onClick={() => setPreviewKey(Date.now())}
            className="flex items-center gap-2 px-5 py-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded-2xl transition-all group"
            title="Refresh Preview"
          >
            <RefreshCw size={16} className="group-hover:animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Refresh</span>
          </button>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl flex flex-col items-center">
          <div className="flex items-center justify-between w-full mb-6">
            <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest">
              Server Rendered Image
            </h3>
            <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider px-3 py-1.5 bg-white/[0.03] rounded-lg border border-white/5">
              {paperSize} · {layout === "HORIZONTAL" ? "Landscape" : "Portrait"}
            </span>
          </div>

          <div className={`group relative w-full ${getPreviewAspect()} border border-white/5 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner max-w-3xl transition-all duration-500`}>
            {previewBlobUrl ? (
              <img
                src={previewBlobUrl}
                alt="Certificate Render Preview"
                className="max-h-full max-w-full object-contain animate-in fade-in duration-300"
              />
            ) : previewError ? (
              <div className="text-red-500 text-xs font-mono">
                FAILED_TO_LOAD_PREVIEW
              </div>
            ) : (
              <div className="text-white/20 animate-pulse text-xs font-mono uppercase tracking-widest">
                GENERATING_PREVIEW...
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
