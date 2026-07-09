"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Save, Upload, ImageIcon, RefreshCw, FileText } from "lucide-react";
import { toast } from "sonner";

export default function CertificateTemplatePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [layout, setLayout] = useState<"HORIZONTAL" | "VERTICAL">("HORIZONTAL");
  const [instructorName, setInstructorName] = useState("");
  const [instructorNip, setInstructorNip] = useState("");
  const [bgPath, setBgPath] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

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
      const [settingsRes, detailsRes] = await Promise.all([
        api.get("/admin/settings"),
        api.get("/admin/settings/details"),
      ]);

      if (settingsRes.data.ok && settingsRes.data.settings) {
        setLayout(settingsRes.data.settings.certificateLayout);
      }

      if (detailsRes.data.ok && detailsRes.data.data) {
        setInstructorName(detailsRes.data.data.instructorName);
        setInstructorNip(detailsRes.data.data.instructorNip);
        setBgPath(detailsRes.data.data.certificateTemplate);
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
        
        {/* Left Columns - Form Configurations */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* Orientation switch */}
          <div className="glass-panel p-8 rounded-3xl border-transparent shadow-xl">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <FileText size={20} className="text-neon-pink" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Print Orientation
              </h3>
            </div>
            <div className="space-y-4 mt-6">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                System Default certificate Layout (A4)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleOrientationChange("HORIZONTAL")}
                  className={`py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
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
                  className={`py-3.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
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

          {/* Background template Upload */}
          <div className="glass-panel p-8 rounded-3xl border-transparent shadow-xl">
            <div className="flex items-center gap-4 border-b border-white/5 pb-6">
              <ImageIcon size={20} className="text-neon-blue" />
              <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                Default Background Template
              </h3>
            </div>
            <div className="mt-6 space-y-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                Upload Default Certificate Background (1920x1080 horizontal or 1080x1920 vertical)
              </p>
              
              <div className="relative w-full aspect-[16/10] bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-white/20 transition-all">
                {bgPath ? (
                  <div className="text-center p-4">
                    <p className="text-xs text-white/60 font-semibold break-all mb-2">
                      Template Loaded:
                    </p>
                    <p className="text-[10px] text-teal-400 font-mono select-all">
                      {bgPath}
                    </p>
                  </div>
                ) : (
                  <div className="text-white/20 flex flex-col items-center">
                    <ImageIcon size={48} className="mb-4" />
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

          {/* Instructor Signatures */}
          <div className="glass-panel p-8 rounded-3xl border-transparent shadow-xl">
            <form onSubmit={handleSaveDetails} className="space-y-6">
              <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                <Save size={20} className="text-neon-purple" />
                <h3 className="font-bold text-white text-xs uppercase tracking-widest">
                  Instructor Details (Global)
                </h3>
              </div>
              
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    Head Instructor / Principal Name
                  </label>
                  <input
                    type="text"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    placeholder="e.g. Budi Headmaster, M.T."
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                    NIP / Instructor Registration ID
                  </label>
                  <input
                    type="text"
                    value={instructorNip}
                    onChange={(e) => setInstructorNip(e.target.value)}
                    placeholder="e.g. 198706152010121002"
                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-white font-semibold focus:outline-none focus:border-neon-purple/50 transition-all text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-neon-purple hover:shadow-[0_0_20px_rgba(176,38,255,0.4)] text-white text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-lg active:scale-95"
              >
                {saving ? "Saving Details..." : "Save Instructor Details"}
              </button>
            </form>
          </div>

        </div>

        {/* Right Columns - Visual Layout Preview (A4) */}
        <div className="xl:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden shadow-2xl flex flex-col items-center">
            <h3 className="font-bold text-white/60 text-xs uppercase tracking-widest self-start mb-6">
              Real-time Layout preview (A4 Mock Data)
            </h3>
            
            {/* The Image Preview Container */}
            <div className="group relative w-full aspect-[16/11] border border-white/5 bg-slate-950 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner max-w-3xl">
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
            
            <p className="text-white/30 text-[10px] font-semibold uppercase tracking-widest mt-6 text-center">
              The preview above displays visual overlays including mockup data text (Student Name, Program, NIP, QR code) to inspect print readability.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}
