"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Rnd } from "react-rnd";
import { Settings2, Grid3X3, Save, ZoomIn, ZoomOut, Type, Minus, QrCode, AlignLeft, AlignCenter, AlignRight, EyeOff, Eye, Layers } from "lucide-react";

export interface LayoutElement {
  id: string;
  type: "text" | "line" | "image";
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  visible: boolean;
  align?: "left" | "center" | "right";
}

interface CertificateEditorProps {
  initialConfig: Record<string, LayoutElement> | null;
  paperSize: "A4" | "F4";
  layout: "HORIZONTAL" | "VERTICAL";
  bgPath: string | null;
  onSave: (config: Record<string, LayoutElement>) => Promise<void>;
  onReset: () => Promise<void>;
  isSaving: boolean;
}

// Paper size dimensions at 150 DPI (landscape width x height)
const PAPER_DIMENSIONS: Record<string, { landscape: [number, number]; portrait: [number, number] }> = {
  A4: { landscape: [1754, 1240], portrait: [1240, 1754] },
  F4: { landscape: [1953, 1272], portrait: [1272, 1953] },
};

const DEFAULT_CONFIG: Record<string, LayoutElement> = {
  universityTitle: { id: "universityTitle", type: "text", text: "UNIVERSITAS NEGERI SURABAYA", x: 877, y: 150, fontSize: 18, fontFamily: "Arial", color: "#e2e8f0", bold: true, italic: false, visible: true, align: "center" },
  certificateTitle: { id: "certificateTitle", type: "text", text: "CERTIFICATE OF COMPLETION", x: 877, y: 180, fontSize: 64, fontFamily: "Arial", color: "#67e8f9", bold: true, italic: false, visible: true, align: "center" },
  certIdLabel: { id: "certIdLabel", type: "text", text: "ID: 2DFAD6AB-7BFA-42FE-B2AD-2C63CD147724", x: 877, y: 260, fontSize: 14, fontFamily: "Courier New", color: "#0891b2", bold: false, italic: false, visible: true, align: "center" },
  presentedTo: { id: "presentedTo", type: "text", text: "PROUDLY PRESENTED TO", x: 877, y: 350, fontSize: 18, fontFamily: "Arial", color: "#67e8f9", bold: true, italic: false, visible: true, align: "center" },
  studentName: { id: "studentName", type: "text", text: "Student Name", x: 877, y: 460, fontSize: 110, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center" },
  majorProgram: { id: "majorProgram", type: "text", text: "MAJORITY - S1 SOSIOLOGI IN ILMU SOSIAL", x: 877, y: 600, fontSize: 24, fontFamily: "Arial", color: "#e2e8f0", bold: false, italic: false, visible: true, align: "center" },
  studentId: { id: "studentId", type: "text", text: "NIM : 21050974058", x: 877, y: 640, fontSize: 24, fontFamily: "Arial", color: "#06b6d4", bold: true, italic: false, visible: true, align: "center" },
  courseSubtitle: { id: "courseSubtitle", type: "text", text: "Has successfully completed the educational and training program requirements on the topic of:", x: 877, y: 720, fontSize: 18, fontFamily: "Arial", color: "#94a3b8", bold: false, italic: false, visible: true, align: "center" },
  courseTitle: { id: "courseTitle", type: "text", text: "ILMU PENDIDIKAN", x: 877, y: 780, fontSize: 56, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center" },
  instructorName: { id: "instructorName", type: "text", text: "Budi Instructor", x: 300, y: 1020, fontSize: 28, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: true, visible: true, align: "center" },
  instructorLine: { id: "instructorLine", type: "line", x: 300, y: 1040, width: 280, height: 2, fontSize: 0, fontFamily: "Arial", color: "#475569", bold: false, italic: false, visible: true },
  instructorTitle: { id: "instructorTitle", type: "text", text: "HEAD INSTRUCTOR", x: 300, y: 1070, fontSize: 16, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: false, visible: true, align: "center" },
  instructorNip: { id: "instructorNip", type: "text", text: "Instructor ID: 12345678", x: 300, y: 1095, fontSize: 12, fontFamily: "Courier New", color: "#0ea5e9", bold: false, italic: false, visible: true, align: "center" },
  issuedDateTitle: { id: "issuedDateTitle", type: "text", text: "DATE ISSUED", x: 877, y: 1020, fontSize: 14, fontFamily: "Arial", color: "#94a3b8", bold: true, italic: false, visible: true, align: "center" },
  issuedDateBox: { id: "issuedDateBox", type: "text", text: "25 December 2025", x: 877, y: 1060, fontSize: 24, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: false, visible: true, align: "center" },
  qrCode: { id: "qrCode", type: "image", x: 1450, y: 1020, width: 140, height: 140, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true },
  scanToVerifyLabel: { id: "scanToVerifyLabel", type: "text", text: "SCAN TO VERIFY", x: 1450, y: 1190, fontSize: 12, fontFamily: "Arial", color: "#0ea5e9", bold: true, italic: false, visible: true, align: "center" },
};

export default function CertificateEditor({ initialConfig, paperSize, layout, bgPath, onSave, onReset, isSaving }: CertificateEditorProps) {
  const [config, setConfig] = useState<Record<string, LayoutElement>>(initialConfig || DEFAULT_CONFIG);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  // Editor Settings
  const [scale, setScale] = useState(0.4);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [guidelines, setGuidelines] = useState<{ x?: number, y?: number }>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Derive canvas dimensions
  const dims = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS["A4"];
  const [canvasWidth, canvasHeight] = layout === "VERTICAL" ? dims.portrait : dims.landscape;

  // Auto-fit scale on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || 800;
        // Leave some padding
        const newScale = Math.min((parentWidth - 40) / canvasWidth, 1);
        setScale(newScale);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasWidth]);

  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      // Merge with default to ensure no missing keys if new fields were added
      const merged = { ...DEFAULT_CONFIG };
      Object.keys(initialConfig).forEach((k) => {
        if (merged[k]) {
          merged[k] = { ...merged[k], ...initialConfig[k] };
        }
      });
      setConfig(merged);
    } else {
      setConfig(DEFAULT_CONFIG);
    }
  }, [initialConfig]);

  const updateElement = (id: string, updates: Partial<LayoutElement>) => {
    setConfig(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  };

  const handleDrag = (id: string, x: number, y: number) => {
    updateElement(id, { x, y });
    
    // Smart guidelines
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const activeGuides: { x?: number, y?: number } = {};
    
    if (Math.abs(x - centerX) < 10) activeGuides.x = centerX;
    if (Math.abs(y - centerY) < 10) activeGuides.y = centerY;
    
    setGuidelines(activeGuides);
  };

  const handleDragStop = (id: string, x: number, y: number) => {
    let finalX = x;
    let finalY = y;
    
    // Apply guideline snapping if close enough
    if (guidelines.x) finalX = guidelines.x;
    if (guidelines.y) finalY = guidelines.y;
    
    updateElement(id, { x: finalX, y: finalY });
    setGuidelines({});
  };

  const elementGroups = [
    { title: "Top Header", keys: ["universityTitle", "certificateTitle", "certIdLabel"] },
    { title: "Middle Body", keys: ["presentedTo", "studentName", "majorProgram", "studentId", "courseSubtitle", "courseTitle"] },
    { title: "Instructor Sign", keys: ["instructorName", "instructorLine", "instructorTitle", "instructorNip"] },
    { title: "Date Stamp", keys: ["issuedDateTitle", "issuedDateBox"] },
    { title: "QR Verification", keys: ["qrCode", "scanToVerifyLabel"] },
  ];

  return (
    <div className="flex h-[850px] w-full bg-slate-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative font-sans">
      
      {/* LEFT SIDEBAR: Variables Manager */}
      <div className="w-72 bg-slate-900 border-r border-white/10 flex flex-col h-full z-10 shrink-0">
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          <Layers className="text-cyan-400" size={20} />
          <h3 className="text-white font-bold tracking-tight">Variables Layer</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
          {elementGroups.map(group => (
            <div key={group.title}>
              <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-2 mb-2">{group.title}</h4>
              <div className="space-y-1">
                {group.keys.map(key => {
                  const el = config[key];
                  if (!el) return null;
                  const isSelected = selectedId === key;
                  
                  return (
                    <div 
                      key={key} 
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/10 border border-cyan-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                      onClick={() => setSelectedId(key)}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        {el.type === 'text' ? <Type size={14} className="text-white/40 shrink-0" /> : 
                         el.type === 'image' ? <QrCode size={14} className="text-white/40 shrink-0" /> : 
                         <Minus size={14} className="text-white/40 shrink-0" />}
                        <span className={`text-xs truncate ${isSelected ? 'text-cyan-400 font-medium' : 'text-slate-300'}`}>
                          {el.id}
                        </span>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          updateElement(key, { visible: !el.visible });
                        }}
                        className={`p-1 rounded transition-colors ${el.visible ? 'text-slate-400 hover:text-white' : 'text-rose-500 hover:text-rose-400'}`}
                        title={el.visible ? "Hide element" : "Show element"}
                      >
                        {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950">
        
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/10">
              <button onClick={() => setScale(s => Math.max(0.1, s - 0.05))} className="text-white/50 hover:text-white"><ZoomOut size={16} /></button>
              <span className="text-xs font-mono text-white/80 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => setScale(s => Math.min(2, s + 0.05))} className="text-white/50 hover:text-white"><ZoomIn size={16} /></button>
            </div>
            
            <div className="w-px h-6 bg-white/10 mx-2" />
            
            <button 
              onClick={() => setShowGrid(!showGrid)} 
              className={`p-2 rounded-lg transition-colors ${showGrid ? "bg-cyan-500/20 text-cyan-400" : "text-white/40 hover:text-white/80"}`}
              title="Toggle Grid Overlay"
            >
              <Grid3X3 size={18} />
            </button>
            
            <select 
              value={gridSize} 
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="bg-slate-900 border border-white/10 text-white text-xs rounded-lg px-2 py-1.5 outline-none"
              title="Grid Spacing"
            >
              <option value={10}>10px</option>
              <option value={20}>20px</option>
              <option value={40}>40px</option>
              <option value={100}>100px</option>
            </select>
            
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
              <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} className="rounded border-white/20 bg-transparent text-cyan-500" />
              Snap
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onReset}
              className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-all"
            >
              Reset Default
            </button>
            <button 
              onClick={() => onSave(config)}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? "Saving..." : "Save Layout"}
            </button>
          </div>
        </div>

        {/* Editor Main Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-slate-900/50 flex items-center justify-center p-8 custom-scrollbar"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          <div 
            className="relative bg-slate-950 shadow-[0_0_50px_rgba(0,0,0,0.8)] origin-top-left"
            style={{ 
              width: canvasWidth, 
              height: canvasHeight,
              transform: `scale(${scale})`,
              backgroundImage: bgPath ? `url(${bgPath})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minWidth: canvasWidth,
              minHeight: canvasHeight
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedId(null);
            }}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)`,
                  backgroundSize: `${gridSize}px ${gridSize}px`
                }}
              />
            )}

            {/* Guidelines */}
            {guidelines.x && <div className="absolute top-0 bottom-0 w-[2px] bg-fuchsia-500 z-50 pointer-events-none shadow-[0_0_8px_#d946ef]" style={{ left: guidelines.x }} />}
            {guidelines.y && <div className="absolute left-0 right-0 h-[2px] bg-fuchsia-500 z-50 pointer-events-none shadow-[0_0_8px_#d946ef]" style={{ top: guidelines.y }} />}

            {/* Elements */}
            {Object.values(config).map((el) => {
              if (!el.visible && selectedId !== el.id) return null; // hide invisible unless selected

              const isSelected = selectedId === el.id;

              return (
                <Rnd
                  key={el.id}
                  position={{ x: el.x, y: el.y }}
                  size={el.width && el.height ? { width: el.width, height: el.height } : undefined}
                  onDragStart={() => setSelectedId(el.id)}
                  onDrag={(e, d) => handleDrag(el.id, d.x, d.y)}
                  onDragStop={(e, d) => handleDragStop(el.id, d.x, d.y)}
                  onResizeStop={(e, dir, ref, delta, position) => {
                    updateElement(el.id, { 
                      width: parseInt(ref.style.width), 
                      height: parseInt(ref.style.height),
                      x: position.x,
                      y: position.y
                    });
                  }}
                  dragGrid={snapToGrid ? [gridSize, gridSize] : [1, 1]}
                  bounds="parent"
                  className={`group ${isSelected ? 'z-50' : 'z-10 hover:z-40'}`}
                  enableResizing={el.type === "image" || el.type === "line" ? undefined : false}
                  disableDragging={!isSelected && selectedId !== null} // optimize performance
                >
                  <div 
                    className={`relative w-full h-full flex transition-colors ${isSelected ? 'ring-4 ring-cyan-500 bg-cyan-500/10' : 'hover:ring-4 hover:ring-white/20'}`}
                    style={{ opacity: el.visible ? 1 : 0.3 }}
                  >
                    
                    {isSelected && (
                      <div className="absolute -top-12 left-0 bg-slate-900 text-white text-base font-mono px-3 py-1 rounded shadow-lg whitespace-nowrap z-50 pointer-events-none">
                        X: {Math.round(el.x)} Y: {Math.round(el.y)}
                      </div>
                    )}

                    {el.type === "text" && (
                      <div 
                        style={{
                          fontFamily: el.fontFamily,
                          fontSize: `${el.fontSize}px`,
                          color: el.color,
                          fontWeight: el.bold ? "bold" : "normal",
                          fontStyle: el.italic ? "italic" : "normal",
                          textAlign: el.align,
                          whiteSpace: "nowrap"
                        }}
                        className="cursor-move pointer-events-none leading-none select-none relative"
                      >
                        {/* Editor mock representations of special backgrounds */}
                        {el.id === "presentedTo" && (
                          <div className="absolute inset-0 -mx-6 -my-3 bg-slate-900 border border-cyan-900 rounded-full -z-10 pointer-events-none" />
                        )}
                        {el.id === "issuedDateBox" && (
                          <div className="absolute inset-0 -mx-6 -my-4 bg-slate-900 rounded-xl border border-white/5 -z-10 pointer-events-none" />
                        )}
                        {el.text}
                      </div>
                    )}

                    {el.type === "line" && (
                      <div className="w-full h-full flex items-center justify-center cursor-move">
                        <div style={{ width: el.width, height: el.height || 2, backgroundColor: el.color }} className="pointer-events-none" />
                      </div>
                    )}

                    {el.type === "image" && (
                      <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-slate-300 bg-slate-100/50 cursor-move pointer-events-none relative rounded-xl">
                        {el.id === "qrCode" && <div className="absolute inset-0 rounded-xl shadow-[0_0_30px_#c026d3]" />}
                        <QrCode size={el.width ? el.width / 3 : 48} className="text-slate-400 z-10" />
                      </div>
                    )}
                  </div>
                </Rnd>
              );
            })}
          </div>
        </div>

        {/* Bottom Properties Panel (for selected element) */}
        <div className={`transition-all duration-300 border-t border-white/10 bg-slate-900 shrink-0 ${selectedId ? 'h-32 opacity-100' : 'h-0 opacity-0 overflow-hidden'}`}>
          {selectedId && config[selectedId] && (
            <div className="h-full flex items-center px-8 gap-10">
              <div className="flex flex-col gap-1 w-48">
                <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest">{selectedId}</span>
                <span className="text-sm text-white/50">{config[selectedId].type.toUpperCase()} ELEMENT</span>
              </div>

              <div className="flex items-center gap-8">
                {config[selectedId].type === "text" && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Font Size ({config[selectedId].fontSize}px)</label>
                      <input 
                        type="range" 
                        min="10" max="250" 
                        value={config[selectedId].fontSize}
                        onChange={(e) => updateElement(selectedId, { fontSize: Number(e.target.value) })}
                        className="w-32 accent-cyan-500"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Font</label>
                      <select 
                        value={config[selectedId].fontFamily}
                        onChange={(e) => updateElement(selectedId, { fontFamily: e.target.value })}
                        className="bg-slate-950 border border-white/10 text-sm text-white px-3 py-1.5 rounded"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Verdana">Verdana</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-950 rounded p-1 border border-white/10 mt-5">
                      <button onClick={() => updateElement(selectedId, { bold: !config[selectedId].bold })} className={`px-3 py-1.5 text-base font-serif rounded ${config[selectedId].bold ? "bg-white/10 font-bold text-white" : "text-white/40"}`}>B</button>
                      <button onClick={() => updateElement(selectedId, { italic: !config[selectedId].italic })} className={`px-3 py-1.5 text-base font-serif rounded ${config[selectedId].italic ? "bg-white/10 italic text-white" : "text-white/40"}`}>I</button>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={config[selectedId].color}
                      onChange={(e) => updateElement(selectedId, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={config[selectedId].color}
                      onChange={(e) => updateElement(selectedId, { color: e.target.value })}
                      className="w-24 bg-slate-950 border border-white/10 text-sm text-white px-2 py-1.5 rounded font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
