"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Rnd } from "react-rnd";
import {
  Grid3X3,
  Save,
  ZoomIn,
  ZoomOut,
  Type,
  Minus,
  QrCode,
  EyeOff,
  Eye,
  Layers,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  CheckSquare,
  Square,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Palette,
  Undo2,
  Redo2,
  Sparkles,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  FolderMinus,
  Folder,
  FolderOpen,
  Boxes,
  Maximize,
  Shapes,
  Circle,
  RectangleHorizontal,
  Badge,
  Table,
} from "lucide-react";

export interface CustomGroup {
  id: string;
  name: string;
  collapsed?: boolean;
}

export interface LayoutElement {
  id: string;
  type: "text" | "line" | "image" | "shape" | "table";
  text?: string;
  label?: string;
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
  imageUrl?: string;
  opacity?: number;
  lockAspectRatio?: boolean;
  isCustom?: boolean;
  locked?: boolean;
  zIndex?: number;
  groupId?: string;

  // Fitur Shape & Gaya Visual Dinamis
  shapeType?: "rectangle" | "rounded-rect" | "circle" | "badge";
  fillType?: "solid" | "gradient" | "none";
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  colorMode?: "solid" | "gradient";
  gradientColor2?: string;
  hasGlow?: boolean;
  glowColor?: string;
  glowBlur?: number;

  // Fitur Tabel Kompetensi Transkrip Halaman 2
  tableHeaderBg?: string;
  tableHeaderColor?: string;
  tableRowBg?: string;
  tableRowAltBg?: string;
  tableBorderColor?: string;
  tableTextColor?: string;
  tableScoreColor?: string;
  tableFontSize?: number;
  tableHeaderFontSize?: number;
  tableDensity?: "compact" | "normal" | "spacious";
  showScoreColumn?: boolean;
  showStandardColumn?: boolean;
  showCodeColumn?: boolean;
  showAverageRow?: boolean;
}

export interface BackgroundConfig {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
  lockAspectRatio: boolean;
  fitMode: "cover" | "contain" | "stretch" | "custom";
  opacity: number;
  canvasBgColor?: string;
}

export interface CertificateLayoutConfig {
  paperSize?: string;
  paperWidthCm?: number;
  paperHeightCm?: number;
  canvasBgColor?: string;
  showDecorativeFrame?: boolean;
  followTemplateDesign?: boolean;
  layoutMode?: "STANDARD" | "QR_ONLY";
  backgroundConfig?: BackgroundConfig;
  customGroups?: Record<string, CustomGroup>;
  elements: Record<string, LayoutElement>;
}

interface CertificateEditorProps {
  initialConfig: CertificateLayoutConfig | Record<string, LayoutElement> | null;
  paperSize: string;
  paperWidthCm?: number;
  paperHeightCm?: number;
  layout: "HORIZONTAL" | "VERTICAL";
  bgPath: string | null;
  pageType?: "certificate" | "transcript";
  institutionLogo?: string | null;
  institutionName?: string | null;
  institutionSubtext?: string | null;
  onSave: (config: CertificateLayoutConfig) => Promise<void>;
  onReset: () => Promise<void>;
  isSaving: boolean;
}

// 150 DPI conversion constant
const DPI = 150;
const CM_TO_PX = DPI / 2.54; // ~59.055118 px/cm

const PAPER_PRESETS_CM: Record<string, { width: number; height: number }> = {
  A4: { width: 29.7, height: 21.0 },
  F4: { width: 33.0, height: 21.5 },
  LETTER: { width: 27.94, height: 21.59 },
};

const PRIMARY_SWATCHES = [
  { name: "Gold Formal", color: "#d97706" },
  { name: "Royal Blue", color: "#1e40af" },
  { name: "Emerald Green", color: "#059669" },
  { name: "Crimson Red", color: "#dc2626" },
  { name: "Deep Charcoal", color: "#0f172a" },
  { name: "Pure White", color: "#ffffff" },
  { name: "Cyan Glow", color: "#06b6d4" },
  { name: "Sky Blue", color: "#38bdf8" },
  { name: "Neon Purple", color: "#a855f7" },
  { name: "Slate Grey", color: "#64748b" },
];

const DEFAULT_BG_CONFIG: BackgroundConfig = {
  scaleX: 100,
  scaleY: 100,
  offsetX: 0,
  offsetY: 0,
  lockAspectRatio: true,
  fitMode: "custom",
  opacity: 100,
  canvasBgColor: "#0B0F19",
};

// Tata letak default Horizontal Halaman 1 (Landscape ~1754 x 1240 px, Center X = 877)
const DEFAULT_HORIZONTAL_ELEMENTS: Record<string, LayoutElement> = {
  universityLogo: { id: "universityLogo", type: "image", label: "Logo Universitas", x: 877, y: 110, width: 120, height: 120, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "/assets/unesa-logo.png", lockAspectRatio: true, locked: false, zIndex: 10 },
  universityTitle: { id: "universityTitle", type: "text", label: "Nama Universitas", text: "UNIVERSITAS NEGERI SURABAYA", x: 877, y: 220, width: 700, height: 35, fontSize: 24, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 11 },
  certificateTitle: { id: "certificateTitle", type: "text", label: "Judul Sertifikat", text: "SERTIFIKAT UJI KOMPETENSI KEAHLIAN", x: 877, y: 295, width: 1000, height: 80, fontSize: 52, fontFamily: "Arial", color: "#38bdf8", colorMode: "solid", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 12 },
  certificateNumber: { id: "certificateNumber", type: "text", label: "Nomor Sertifikat Resmi", text: "No: 421.5/089/SMKN1/RPL/2026", x: 877, y: 355, width: 500, height: 26, fontSize: 16, fontFamily: "Arial", color: "#38bdf8", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 12.5 },
  certIdLabel: { id: "certIdLabel", type: "text", label: "ID Registrasi Blockchain", text: "ID: CERT-2026-0001", x: 877, y: 385, width: 350, height: 25, fontSize: 14, fontFamily: "Courier New", color: "#0ea5e9", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 13 },
  presentedTo: { id: "presentedTo", type: "text", label: "Pill Proudly Presented", text: "DIBERIKAN KEPADA", x: 877, y: 440, width: 320, height: 36, fontSize: 16, fontFamily: "Arial", color: "#67e8f9", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 14 },
  studentName: { id: "studentName", type: "text", label: "Nama Penerima (Siswa)", text: "Student Name", x: 877, y: 510, width: 1000, height: 90, fontSize: 72, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 15 },
  schoolName: { id: "schoolName", type: "text", label: "Asal Sekolah / Satuan Pendidikan", text: "SMK NEGERI 1 SURABAYA", x: 877, y: 590, width: 700, height: 30, fontSize: 19, fontFamily: "Arial", color: "#e2e8f0", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 15.5 },
  majorProgram: { id: "majorProgram", type: "text", label: "Jurusan & Program Studi", text: "TEKNOLOGI INFORMASI - REKAYASA PERANGKAT LUNAK", x: 877, y: 625, width: 750, height: 30, fontSize: 18, fontFamily: "Arial", color: "#cbd5e1", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 16 },
  studentId: { id: "studentId", type: "text", label: "NISN / ID Siswa", text: "NISN / ID : 0056789123", x: 877, y: 665, width: 500, height: 30, fontSize: 17, fontFamily: "Arial", color: "#06b6d4", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 17 },
  courseSubtitle: { id: "courseSubtitle", type: "text", label: "Sub-keterangan Pelatihan", text: "Telah memenuhi standar kelulusan dan kompetensi pada skema:", x: 877, y: 720, width: 800, height: 26, fontSize: 16, fontFamily: "Arial", color: "#94a3b8", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 18 },
  courseTitle: { id: "courseTitle", type: "text", label: "Nama Kursus / Pelatihan", text: "UJI KOMPETENSI KEAHLIAN (UKK) REKAYASA PERANGKAT LUNAK", x: 877, y: 765, width: 1000, height: 60, fontSize: 38, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 19 },
  
  // Signer 1 (Internal Sekolah) - Left Bottom Column (X = 420)
  instructorSignature: { id: "instructorSignature", type: "image", label: "Tanda Tangan Signer 1 (PNG)", x: 420, y: 935, width: 150, height: 70, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 19 },
  instructorName: { id: "instructorName", type: "text", label: "Nama Kepala Sekolah (Signer 1)", text: "Drs. H. Mulyono, M.Pd.", x: 420, y: 990, width: 360, height: 38, fontSize: 24, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: true, visible: true, align: "center", locked: false, zIndex: 20 },
  instructorLine: { id: "instructorLine", type: "line", label: "Garis TTD Kepala Sekolah", x: 420, y: 1030, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#475569", bold: false, italic: false, visible: true, locked: false, zIndex: 21 },
  instructorTitle: { id: "instructorTitle", type: "text", label: "Jabatan Signer 1", text: "KEPALA SEKOLAH / PENGUJI", x: 420, y: 1045, width: 320, height: 24, fontSize: 14, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 22 },
  instructorNip: { id: "instructorNip", type: "text", label: "NIP Kepala Sekolah", text: "NIP: 197204121998021003", x: 420, y: 1075, width: 320, height: 24, fontSize: 12, fontFamily: "Courier New", color: "#38bdf8", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 23 },
  
  // Center Column: QR Code & Verification (Center X = 877)
  qrCode: { id: "qrCode", type: "image", label: "QR Code Verifikasi", x: 877, y: 980, width: 130, height: 130, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, lockAspectRatio: true, locked: false, zIndex: 28 },
  scanToVerifyLabel: { id: "scanToVerifyLabel", type: "text", label: "Label Scan to Verify", text: "PINDAI VERIFIKASI", x: 877, y: 1080, width: 180, height: 24, fontSize: 12, fontFamily: "Arial", color: "#0ea5e9", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 29 },

  // Signer 2 (Eksternal / Mitra DUDI) - Right Bottom Column (X = 1334)
  signer2Signature: { id: "signer2Signature", type: "image", label: "Tanda Tangan Signer 2 (PNG)", x: 1334, y: 935, width: 150, height: 70, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: false, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 23.5 },
  signer2Name: { id: "signer2Name", type: "text", label: "Nama Asesor DUDI (Signer 2)", text: "Ir. Hendra Kusuma, M.Kom.", x: 1334, y: 990, width: 360, height: 38, fontSize: 24, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: true, visible: false, align: "center", locked: false, zIndex: 24 },
  signer2Line: { id: "signer2Line", type: "line", label: "Garis TTD Asesor DUDI", x: 1334, y: 1030, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#475569", bold: false, italic: false, visible: false, locked: false, zIndex: 25 },
  signer2Title: { id: "signer2Title", type: "text", label: "Jabatan Asesor DUDI", text: "ASESOR MITRA INDUSTRI (DUDI)", x: 1334, y: 1045, width: 340, height: 24, fontSize: 14, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 26 },
  signer2Nip: { id: "signer2Nip", type: "text", label: "Instansi / REG Asesor DUDI", text: "PT. TELKOM INDONESIA TBK", x: 1334, y: 1075, width: 340, height: 24, fontSize: 12, fontFamily: "Courier New", color: "#38bdf8", bold: false, italic: false, visible: false, align: "center", locked: false, zIndex: 27 },
};

// Tata letak default Vertikal Halaman 1 (Portrait ~1240 x 1754 px, Center X = 620)
const DEFAULT_VERTICAL_ELEMENTS: Record<string, LayoutElement> = {
  universityLogo: { id: "universityLogo", type: "image", label: "Logo Universitas", x: 620, y: 130, width: 120, height: 120, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "/assets/unesa-logo.png", lockAspectRatio: true, locked: false, zIndex: 10 },
  universityTitle: { id: "universityTitle", type: "text", label: "Nama Universitas", text: "UNIVERSITAS NEGERI SURABAYA", x: 620, y: 235, width: 600, height: 35, fontSize: 22, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 11 },
  certificateTitle: { id: "certificateTitle", type: "text", label: "Judul Sertifikat", text: "SERTIFIKAT UJI KOMPETENSI", x: 620, y: 310, width: 700, height: 70, fontSize: 44, fontFamily: "Arial", color: "#38bdf8", colorMode: "solid", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 12 },
  certificateNumber: { id: "certificateNumber", type: "text", label: "Nomor Sertifikat Resmi", text: "No: 421.5/089/SMKN1/RPL/2026", x: 620, y: 365, width: 450, height: 26, fontSize: 15, fontFamily: "Arial", color: "#38bdf8", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 12.5 },
  certIdLabel: { id: "certIdLabel", type: "text", label: "ID Registrasi Blockchain", text: "ID: CERT-2026-0001", x: 620, y: 390, width: 350, height: 25, fontSize: 13, fontFamily: "Courier New", color: "#0ea5e9", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 13 },
  presentedTo: { id: "presentedTo", type: "text", label: "Pill Proudly Presented", text: "DIBERIKAN KEPADA", x: 620, y: 450, width: 300, height: 36, fontSize: 15, fontFamily: "Arial", color: "#67e8f9", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 14 },
  studentName: { id: "studentName", type: "text", label: "Nama Penerima (Siswa)", text: "Student Name", x: 620, y: 535, width: 750, height: 85, fontSize: 60, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 15 },
  schoolName: { id: "schoolName", type: "text", label: "Asal Sekolah / Satuan Pendidikan", text: "SMK NEGERI 1 SURABAYA", x: 620, y: 605, width: 600, height: 28, fontSize: 17, fontFamily: "Arial", color: "#e2e8f0", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 15.5 },
  majorProgram: { id: "majorProgram", type: "text", label: "Jurusan & Program Studi", text: "TEKNIK - REKAYASA PERANGKAT LUNAK", x: 620, y: 635, width: 650, height: 30, fontSize: 16, fontFamily: "Arial", color: "#cbd5e1", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 16 },
  studentId: { id: "studentId", type: "text", label: "NISN / ID Siswa", text: "NISN / ID : 0056789123", x: 620, y: 670, width: 450, height: 30, fontSize: 15, fontFamily: "Arial", color: "#06b6d4", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 17 },
  courseSubtitle: { id: "courseSubtitle", type: "text", label: "Sub-keterangan Pelatihan", text: "Telah memenuhi standar kelulusan pada skema:", x: 620, y: 735, width: 650, height: 26, fontSize: 14, fontFamily: "Arial", color: "#94a3b8", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 18 },
  courseTitle: { id: "courseTitle", type: "text", label: "Nama Kursus / Pelatihan", text: "UJI KOMPETENSI KEAHLIAN (UKK)", x: 620, y: 785, width: 750, height: 55, fontSize: 32, fontFamily: "Arial", color: "#ffffff", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 19 },
  qrCode: { id: "qrCode", type: "image", label: "QR Code Verifikasi", x: 620, y: 1100, width: 140, height: 140, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, lockAspectRatio: true, locked: false, zIndex: 20 },
  scanToVerifyLabel: { id: "scanToVerifyLabel", type: "text", label: "Label Scan to Verify", text: "PINDAI VERIFIKASI", x: 620, y: 1205, width: 180, height: 24, fontSize: 12, fontFamily: "Arial", color: "#0ea5e9", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 21 },
  
  // Signer 1 (Internal Sekolah) - Left Column (X = 320)
  instructorSignature: { id: "instructorSignature", type: "image", label: "Tanda Tangan Kepala Sekolah (PNG)", x: 320, y: 1385, width: 150, height: 70, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 21.5 },
  instructorName: { id: "instructorName", type: "text", label: "Nama Kepala Sekolah", text: "Drs. H. Mulyono, M.Pd.", x: 320, y: 1440, width: 360, height: 38, fontSize: 22, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: true, visible: true, align: "center", locked: false, zIndex: 22 },
  instructorLine: { id: "instructorLine", type: "line", label: "Garis Tanda Tangan", x: 320, y: 1480, width: 280, height: 2, fontSize: 0, fontFamily: "Arial", color: "#475569", bold: false, italic: false, visible: true, locked: false, zIndex: 23 },
  instructorTitle: { id: "instructorTitle", type: "text", label: "Jabatan Kepala Sekolah", text: "KEPALA SEKOLAH / PENGUJI", x: 320, y: 1500, width: 280, height: 24, fontSize: 14, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 24 },
  instructorNip: { id: "instructorNip", type: "text", label: "NIP Kepala Sekolah", text: "NIP: 197204121998021003", x: 320, y: 1530, width: 320, height: 24, fontSize: 12, fontFamily: "Courier New", color: "#38bdf8", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 25 },
  
  // Signer 2 (Eksternal / Mitra DUDI) - Right Column (X = 920)
  signer2Signature: { id: "signer2Signature", type: "image", label: "Tanda Tangan Signer 2 (PNG)", x: 920, y: 1385, width: 150, height: 70, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: false, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 26 },
  signer2Name: { id: "signer2Name", type: "text", label: "Nama Asesor DUDI (Signer 2)", text: "Ir. Hendra Kusuma, M.Kom.", x: 920, y: 1440, width: 360, height: 38, fontSize: 22, fontFamily: "Arial", color: "#f8fafc", bold: true, italic: true, visible: false, align: "center", locked: false, zIndex: 27 },
  signer2Line: { id: "signer2Line", type: "line", label: "Garis TTD Asesor DUDI", x: 920, y: 1480, width: 280, height: 2, fontSize: 0, fontFamily: "Arial", color: "#475569", bold: false, italic: false, visible: false, locked: false, zIndex: 28 },
  signer2Title: { id: "signer2Title", type: "text", label: "Jabatan Asesor DUDI", text: "ASESOR MITRA INDUSTRI (DUDI)", x: 920, y: 1500, width: 280, height: 24, fontSize: 14, fontFamily: "Arial", color: "#cbd5e1", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 29 },
  signer2Nip: { id: "signer2Nip", type: "text", label: "Instansi / REG Asesor DUDI", text: "PT. TELKOM INDONESIA TBK", x: 920, y: 1530, width: 320, height: 24, fontSize: 12, fontFamily: "Courier New", color: "#38bdf8", bold: false, italic: false, visible: false, align: "center", locked: false, zIndex: 30 },
};

// Tata letak default Horizontal Halaman 2 (Transkrip Nilai Landscape ~1754 x 1240 px, Center X = 877)
export const DEFAULT_TRANSCRIPT_HORIZONTAL_ELEMENTS: Record<string, LayoutElement> = {
  headerTitle: { id: "headerTitle", type: "text", label: "Judul Utama Header", text: "KOMPETENSI KEAHLIAN REKAYASA PERANGKAT LUNAK", x: 877, y: 70, width: 1450, height: 40, fontSize: 24, fontFamily: "Arial", color: "#0284c7", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 10 },
  subHeaderTitle: { id: "subHeaderTitle", type: "text", label: "Sub-Judul Header", text: "DAFTAR KOMPETENSI / SUB. KOMPETENSI (TRANSKRIP NILAI SKKNI)", x: 877, y: 115, width: 1450, height: 35, fontSize: 18, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 11 },
  courseSubtitle: { id: "courseSubtitle", type: "text", label: "Skema / Keterangan Pelatihan", text: "Skema Sertifikasi: Rekayasa Perangkat Lunak & Sistem Terdistribusi", x: 877, y: 155, width: 1100, height: 25, fontSize: 14, fontFamily: "Arial", color: "#64748b", bold: false, italic: true, visible: true, align: "center", locked: false, zIndex: 12 },
  
  // Kotak Info Peserta & Sekolah
  studentMetaBox: { id: "studentMetaBox", type: "shape", label: "Kotak Data Siswa & Lembaga", shapeType: "rounded-rect", x: 877, y: 240, width: 1550, height: 95, color: "#f8fafc", fillType: "solid", borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 14, fontSize: 0, fontFamily: "Arial", bold: false, italic: false, visible: true, locked: false, zIndex: 13 },
  studentNameMeta: { id: "studentNameMeta", type: "text", label: "Metadata Nama Siswa", text: "Nama : John Doe", x: 180, y: 220, width: 450, height: 25, fontSize: 14, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "left", locked: false, zIndex: 14 },
  studentIdMeta: { id: "studentIdMeta", type: "text", label: "Metadata NIS / ID", text: "NIS / ID : 2024150042", x: 180, y: 255, width: 450, height: 25, fontSize: 13, fontFamily: "Courier New", color: "#0284c7", bold: true, italic: false, visible: true, align: "left", locked: false, zIndex: 14 },
  schoolNameMeta: { id: "schoolNameMeta", type: "text", label: "Metadata Satuan Pendidikan", text: "Satuan Pendidikan : SMK NEGERI 1 SURABAYA", x: 1570, y: 220, width: 550, height: 25, fontSize: 13, fontFamily: "Arial", color: "#334155", bold: true, italic: false, visible: true, align: "right", locked: false, zIndex: 14 },
  majorProgramMeta: { id: "majorProgramMeta", type: "text", label: "Metadata Program Keahlian", text: "Program Keahlian : REKAYASA PERANGKAT LUNAK", x: 1570, y: 255, width: 550, height: 25, fontSize: 13, fontFamily: "Arial", color: "#64748b", bold: false, italic: false, visible: true, align: "right", locked: false, zIndex: 14 },

  // Tabel Kompetensi SKKNI
  tableCompetencies: {
    id: "tableCompetencies",
    type: "table",
    label: "Tabel Unit Kompetensi SKKNI",
    x: 877,
    y: 550,
    width: 1550,
    height: 430,
    fontSize: 13,
    tableFontSize: 13,
    tableHeaderFontSize: 14,
    fontFamily: "Arial",
    color: "#0f172a",
    tableHeaderBg: "#0f172a",
    tableHeaderColor: "#ffffff",
    tableRowBg: "#ffffff",
    tableRowAltBg: "#f8fafc",
    tableBorderColor: "#cbd5e1",
    tableTextColor: "#0f172a",
    tableScoreColor: "#0f172a",
    bold: false,
    italic: false,
    visible: true,
    locked: false,
    zIndex: 15,
    showScoreColumn: true,
    showStandardColumn: true,
    showCodeColumn: true,
    showAverageRow: true,
  },

  // Footer & Signatures
  footerNote: { id: "footerNote", type: "text", label: "Catatan Kaki Transkrip", text: "Dokumen Digital Sah & Terverifikasi Blockchain Ledger · Standar SKKNI & IDUKA", x: 877, y: 1130, width: 1100, height: 25, fontSize: 11, fontFamily: "Courier New", color: "#475569", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 16 },
  blockchainHashNote: { id: "blockchainHashNote", type: "text", label: "Keterangan Kunci Blockchain", text: "Kunci Kriptografis Hash Transkrip Terekam di Ledger Blockchain", x: 877, y: 1158, width: 1100, height: 20, fontSize: 10, fontFamily: "Courier New", color: "#94a3b8", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 17 },

  // Signer 1 (Internal) - Left Bottom (X = 420)
  signer1Title: { id: "signer1Title", type: "text", label: "Jabatan Penandatangan 1", text: "Kepala Sekolah / Ketua Tim Penguji", x: 420, y: 1040, width: 340, height: 25, fontSize: 13, fontFamily: "Arial", color: "#475569", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 18 },
  signer1Signature: { id: "signer1Signature", type: "image", label: "Tanda Tangan Penandatangan 1", x: 420, y: 1090, width: 140, height: 65, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 19 },
  signer1Line: { id: "signer1Line", type: "line", label: "Garis Tanda Tangan 1", x: 420, y: 1130, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#334155", bold: false, italic: false, visible: true, locked: false, zIndex: 20 },
  signer1Name: { id: "signer1Name", type: "text", label: "Nama Penandatangan 1", text: "Sonny Michael Wijaya, S.Kom", x: 420, y: 1150, width: 340, height: 25, fontSize: 14, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 21 },
  signer1Nip: { id: "signer1Nip", type: "text", label: "NIP Penandatangan 1", text: "NIP: 197204121998021003", x: 420, y: 1175, width: 340, height: 20, fontSize: 11, fontFamily: "Courier New", color: "#64748b", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 22 },

  // Signer 2 (Eksternal / DUDI) - Right Bottom (X = 1334)
  signer2Title: { id: "signer2Title", type: "text", label: "Jabatan Penandatangan 2", text: "Asesor Industri (Mitra DUDI)", x: 1334, y: 1040, width: 340, height: 25, fontSize: 13, fontFamily: "Arial", color: "#475569", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 23 },
  signer2Signature: { id: "signer2Signature", type: "image", label: "Tanda Tangan Penandatangan 2", x: 1334, y: 1090, width: 140, height: 65, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: false, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 24 },
  signer2Line: { id: "signer2Line", type: "line", label: "Garis Tanda Tangan 2", x: 1334, y: 1130, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#334155", bold: false, italic: false, visible: false, locked: false, zIndex: 25 },
  signer2Name: { id: "signer2Name", type: "text", label: "Nama Penandatangan 2", text: "Ir. Hendra Kusuma, M.Kom.", x: 1334, y: 1150, width: 340, height: 25, fontSize: 14, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 26 },
  signer2Nip: { id: "signer2Nip", type: "text", label: "NIP / Instansi Signer 2", text: "PT. TELKOM INDONESIA TBK", x: 1334, y: 1175, width: 340, height: 20, fontSize: 11, fontFamily: "Courier New", color: "#64748b", bold: false, italic: false, visible: false, align: "center", locked: false, zIndex: 27 },
};

// Tata letak default Vertikal Halaman 2 (Transkrip Nilai Portrait ~1240 x 1754 px, Center X = 620)
export const DEFAULT_TRANSCRIPT_VERTICAL_ELEMENTS: Record<string, LayoutElement> = {
  headerTitle: { id: "headerTitle", type: "text", label: "Judul Utama Header", text: "KOMPETENSI KEAHLIAN REKAYASA PERANGKAT LUNAK", x: 620, y: 80, width: 1100, height: 40, fontSize: 22, fontFamily: "Arial", color: "#0284c7", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 10 },
  subHeaderTitle: { id: "subHeaderTitle", type: "text", label: "Sub-Judul Header", text: "DAFTAR KOMPETENSI / SUB. KOMPETENSI (TRANSKRIP NILAI SKKNI)", x: 620, y: 125, width: 1100, height: 35, fontSize: 16, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 11 },
  courseSubtitle: { id: "courseSubtitle", type: "text", label: "Skema / Keterangan Pelatihan", text: "Skema Sertifikasi: Rekayasa Perangkat Lunak", x: 620, y: 165, width: 950, height: 25, fontSize: 13, fontFamily: "Arial", color: "#64748b", bold: false, italic: true, visible: true, align: "center", locked: false, zIndex: 12 },
  
  // Kotak Info Peserta & Sekolah
  studentMetaBox: { id: "studentMetaBox", type: "shape", label: "Kotak Data Siswa & Lembaga", shapeType: "rounded-rect", x: 620, y: 260, width: 1120, height: 110, color: "#f8fafc", fillType: "solid", borderColor: "#cbd5e1", borderWidth: 1, borderRadius: 14, fontSize: 0, fontFamily: "Arial", bold: false, italic: false, visible: true, locked: false, zIndex: 13 },
  studentNameMeta: { id: "studentNameMeta", type: "text", label: "Metadata Nama Siswa", text: "Nama : John Doe", x: 100, y: 225, width: 450, height: 25, fontSize: 13, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "left", locked: false, zIndex: 14 },
  studentIdMeta: { id: "studentIdMeta", type: "text", label: "Metadata NIS / ID", text: "NIS / ID : 2024150042", x: 100, y: 255, width: 450, height: 25, fontSize: 12, fontFamily: "Courier New", color: "#0284c7", bold: true, italic: false, visible: true, align: "left", locked: false, zIndex: 14 },
  schoolNameMeta: { id: "schoolNameMeta", type: "text", label: "Metadata Satuan Pendidikan", text: "Satuan Pendidikan : SMK NEGERI 1 SURABAYA", x: 100, y: 285, width: 500, height: 25, fontSize: 12, fontFamily: "Arial", color: "#334155", bold: true, italic: false, visible: true, align: "left", locked: false, zIndex: 14 },
  majorProgramMeta: { id: "majorProgramMeta", type: "text", label: "Metadata Program Keahlian", text: "Program Keahlian : REKAYASA PERANGKAT LUNAK", x: 1140, y: 225, width: 500, height: 25, fontSize: 12, fontFamily: "Arial", color: "#64748b", bold: false, italic: false, visible: true, align: "right", locked: false, zIndex: 14 },

  // Tabel Kompetensi SKKNI
  tableCompetencies: {
    id: "tableCompetencies",
    type: "table",
    label: "Tabel Unit Kompetensi SKKNI",
    x: 620,
    y: 750,
    width: 1120,
    height: 720,
    fontSize: 12,
    tableFontSize: 12,
    tableHeaderFontSize: 13,
    fontFamily: "Arial",
    color: "#0f172a",
    tableHeaderBg: "#0f172a",
    tableHeaderColor: "#ffffff",
    tableRowBg: "#ffffff",
    tableRowAltBg: "#f8fafc",
    tableBorderColor: "#cbd5e1",
    tableTextColor: "#0f172a",
    tableScoreColor: "#0f172a",
    bold: false,
    italic: false,
    visible: true,
    locked: false,
    zIndex: 15,
    showScoreColumn: true,
    showStandardColumn: true,
    showCodeColumn: true,
    showAverageRow: true,
  },

  // Footer & Signer
  footerNote: { id: "footerNote", type: "text", label: "Catatan Kaki Transkrip", text: "Dokumen Digital Sah & Terverifikasi Blockchain Ledger · Standar SKKNI & IDUKA", x: 620, y: 1500, width: 1000, height: 25, fontSize: 10, fontFamily: "Courier New", color: "#475569", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 16 },
  
  // Signer 1 (Internal) - Left Column (X = 320)
  signer1Title: { id: "signer1Title", type: "text", label: "Jabatan Penandatangan 1", text: "Kepala Sekolah / Ketua Tim Penguji", x: 320, y: 1560, width: 340, height: 25, fontSize: 12, fontFamily: "Arial", color: "#475569", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 18 },
  signer1Signature: { id: "signer1Signature", type: "image", label: "Tanda Tangan Penandatangan 1", x: 320, y: 1610, width: 140, height: 60, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: true, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 19 },
  signer1Line: { id: "signer1Line", type: "line", label: "Garis Tanda Tangan 1", x: 320, y: 1650, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#334155", bold: false, italic: false, visible: true, locked: false, zIndex: 20 },
  signer1Name: { id: "signer1Name", type: "text", label: "Nama Penandatangan 1", text: "Sonny Michael Wijaya, S.Kom", x: 320, y: 1670, width: 340, height: 25, fontSize: 13, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: true, align: "center", locked: false, zIndex: 21 },
  signer1Nip: { id: "signer1Nip", type: "text", label: "NIP Penandatangan 1", text: "NIP: 197204121998021003", x: 320, y: 1695, width: 340, height: 20, fontSize: 11, fontFamily: "Courier New", color: "#64748b", bold: false, italic: false, visible: true, align: "center", locked: false, zIndex: 22 },

  // Signer 2 (Eksternal / DUDI) - Right Column (X = 920)
  signer2Title: { id: "signer2Title", type: "text", label: "Jabatan Penandatangan 2", text: "Asesor Industri (Mitra DUDI)", x: 920, y: 1560, width: 340, height: 25, fontSize: 12, fontFamily: "Arial", color: "#475569", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 23 },
  signer2Signature: { id: "signer2Signature", type: "image", label: "Tanda Tangan Penandatangan 2", x: 920, y: 1610, width: 140, height: 60, fontSize: 0, fontFamily: "Arial", color: "#ffffff", bold: false, italic: false, visible: false, imageUrl: "", lockAspectRatio: true, locked: false, zIndex: 24 },
  signer2Line: { id: "signer2Line", type: "line", label: "Garis Tanda Tangan 2", x: 920, y: 1650, width: 260, height: 2, fontSize: 0, fontFamily: "Arial", color: "#334155", bold: false, italic: false, visible: false, locked: false, zIndex: 25 },
  signer2Name: { id: "signer2Name", type: "text", label: "Nama Penandatangan 2", text: "Ir. Hendra Kusuma, M.Kom.", x: 920, y: 1670, width: 340, height: 25, fontSize: 13, fontFamily: "Arial", color: "#0f172a", bold: true, italic: false, visible: false, align: "center", locked: false, zIndex: 26 },
  signer2Nip: { id: "signer2Nip", type: "text", label: "NIP / Instansi Signer 2", text: "PT. TELKOM INDONESIA TBK", x: 920, y: 1695, width: 340, height: 20, fontSize: 11, fontFamily: "Courier New", color: "#64748b", bold: false, italic: false, visible: false, align: "center", locked: false, zIndex: 27 },
};

const MAX_HISTORY = 40;

export default function CertificateEditor({
  initialConfig,
  paperSize,
  paperWidthCm: initialWidthCm,
  paperHeightCm: initialHeightCm,
  layout,
  bgPath,
  pageType = "certificate",
  institutionLogo,
  institutionName,
  institutionSubtext,
  onSave,
  onReset,
  isSaving,
}: CertificateEditorProps) {
  const isTranscript = pageType === "transcript";
  const rawDefaults = isTranscript
    ? (layout === "VERTICAL" ? DEFAULT_TRANSCRIPT_VERTICAL_ELEMENTS : DEFAULT_TRANSCRIPT_HORIZONTAL_ELEMENTS)
    : (layout === "VERTICAL" ? DEFAULT_VERTICAL_ELEMENTS : DEFAULT_HORIZONTAL_ELEMENTS);

  // Inject dynamic institution logo & name into defaults if provided
  const defaultElements: Record<string, LayoutElement> = { ...rawDefaults };
  if (institutionLogo && defaultElements.universityLogo) {
    defaultElements.universityLogo = {
      ...defaultElements.universityLogo,
      imageUrl: institutionLogo,
    };
  }
  if (institutionName && defaultElements.universityTitle) {
    defaultElements.universityTitle = {
      ...defaultElements.universityTitle,
      text: institutionName,
    };
  }

  // Elements & Custom Groups state
  const [elements, setElements] = useState<Record<string, LayoutElement>>(defaultElements);
  const [customGroups, setCustomGroups] = useState<Record<string, CustomGroup>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // History state for Undo and Redo
  const [history, setHistory] = useState<{ elements: Record<string, LayoutElement>; customGroups: Record<string, CustomGroup> }[]>([
    { elements: defaultElements, customGroups: {} },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Background template, Canvas Base Color, and Follow Template Design switch
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    ...DEFAULT_BG_CONFIG,
    canvasBgColor: isTranscript ? "#ffffff" : "#0B0F19",
  });
  const [canvasBgColor, setCanvasBgColor] = useState<string>(isTranscript ? "#ffffff" : "#0B0F19");
  const [showDecorativeFrame, setShowDecorativeFrame] = useState<boolean>(!isTranscript);
  const [followTemplateDesign, setFollowTemplateDesign] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<"STANDARD" | "QR_ONLY">("STANDARD");

  // Track previous layout to detect orientation change
  const prevLayoutRef = useRef<"HORIZONTAL" | "VERTICAL">(layout);

  // Shift key tracker for precision proportional resize
  const [isShiftPressed, setIsShiftPressed] = useState(false);

  // Paper Dimensions in float CM
  const defaultPreset = PAPER_PRESETS_CM[paperSize?.toUpperCase()] || PAPER_PRESETS_CM.A4;
  const [widthCm, setWidthCm] = useState<number>(initialWidthCm || defaultPreset.width);
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm || defaultPreset.height);

  // Editor UI state
  const [scale, setScale] = useState(0.4);
  const [showGrid, setShowGrid] = useState(true);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [guidelines, setGuidelines] = useState<{ x?: number; y?: number }>({});
  const guidelinesRef = useRef<{ x?: number; y?: number }>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const layerUploadRef = useRef<HTMLInputElement>(null);

  // Ref pelacakan posisi drag
  const dragTrackerRef = useRef<{
    draggedId: string;
    mouseStartX: number;
    mouseStartY: number;
    startBoxX: number;
    startBoxY: number;
    initialPositions: Record<string, { x: number; y: number }>;
  } | null>(null);

  // Helper untuk mencatat history snapshot baru
  const pushHistory = useCallback(
    (newElements: Record<string, LayoutElement>, newGroups?: Record<string, CustomGroup>) => {
      const activeGroups = newGroups !== undefined ? newGroups : customGroups;
      setHistory((prevHistory) => {
        const updated = prevHistory.slice(0, historyIndex + 1);
        if (updated.length >= MAX_HISTORY) {
          updated.shift();
        }
        return [...updated, { elements: newElements, customGroups: activeGroups }];
      });
      setHistoryIndex((prevIndex) => Math.min(prevIndex + 1, MAX_HISTORY - 1));
    },
    [historyIndex, customGroups]
  );

  // Fungsi Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      const targetState = history[nextIndex];
      if (targetState) {
        setHistoryIndex(nextIndex);
        setElements(targetState.elements);
        if (targetState.customGroups) setCustomGroups(targetState.customGroups);
      }
    }
  }, [history, historyIndex]);

  // Fungsi Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const targetState = history[nextIndex];
      if (targetState) {
        setHistoryIndex(nextIndex);
        setElements(targetState.elements);
        if (targetState.customGroups) setCustomGroups(targetState.customGroups);
      }
    }
  }, [history, historyIndex]);

  // Hitung dimensi canvas pixel berdasarkan orientasi & float cm (150 DPI)
  let finalWidthCm = widthCm;
  let finalHeightCm = heightCm;
  if (layout === "VERTICAL" && finalWidthCm > finalHeightCm) {
    finalWidthCm = heightCm;
    finalHeightCm = widthCm;
  } else if (layout === "HORIZONTAL" && finalWidthCm < finalHeightCm) {
    finalWidthCm = heightCm;
    finalHeightCm = widthCm;
  }

  const canvasWidth = Math.round(finalWidthCm * CM_TO_PX);
  const canvasHeight = Math.round(finalHeightCm * CM_TO_PX);

  // Adaptasi cerdas saat orientasi berganti (Horizontal ⇄ Vertikal)
  useEffect(() => {
    if (prevLayoutRef.current !== layout) {
      prevLayoutRef.current = layout;
      const targetDefault = isTranscript
        ? (layout === "VERTICAL" ? DEFAULT_TRANSCRIPT_VERTICAL_ELEMENTS : DEFAULT_TRANSCRIPT_HORIZONTAL_ELEMENTS)
        : (layout === "VERTICAL" ? DEFAULT_VERTICAL_ELEMENTS : DEFAULT_HORIZONTAL_ELEMENTS);

      setElements((prev) => {
        const next: Record<string, LayoutElement> = {};
        const newCenterX = Math.round(canvasWidth / 2);

        Object.keys(prev).forEach((k) => {
          const el = prev[k];
          if (!el) return;

          if (targetDefault[k] && !el.isCustom) {
            next[k] = {
              ...el,
              x: targetDefault[k].x,
              y: targetDefault[k].y,
              width: targetDefault[k].width,
              height: targetDefault[k].height,
              fontSize: targetDefault[k].fontSize || el.fontSize,
            };
          } else {
            let newX = el.x;
            let newY = el.y;

            if (el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
              newX = newCenterX;
            } else {
              const maxW = canvasWidth - 100;
              if (newX > maxW) newX = maxW;
            }

            const maxH = canvasHeight - 100;
            if (newY > maxH) newY = maxH;

            next[k] = { ...el, x: Math.round(newX), y: Math.round(newY) };
          }
        });

        pushHistory(next);
        return next;
      });
    }
  }, [layout, canvasWidth, canvasHeight, isTranscript, pushHistory]);

  // Track Shift Key & Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(true);

      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        return;
      }

      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "z" || e.key === "Z") && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y / Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || e.key === "Y" || ((e.key === "z" || e.key === "Z") && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Group: Ctrl+G
      if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G") && !e.shiftKey) {
        e.preventDefault();
        handleGroupSelected();
        return;
      }

      // Ungroup: Ctrl+Shift+G
      if ((e.ctrlKey || e.metaKey) && (e.key === "g" || e.key === "G") && e.shiftKey) {
        e.preventDefault();
        handleUngroupSelected();
        return;
      }

      // Arrow Key Nudge
      if (selectedIds.length > 0) {
        const step = e.shiftKey ? 10 : 1;
        let deltaX = 0;
        let deltaY = 0;

        if (e.key === "ArrowLeft") deltaX = -step;
        else if (e.key === "ArrowRight") deltaX = step;
        else if (e.key === "ArrowUp") deltaY = -step;
        else if (e.key === "ArrowDown") deltaY = step;
        else if (e.key === "Escape") {
          setSelectedIds([]);
          return;
        } else {
          return;
        }

        e.preventDefault();

        setElements((prev) => {
          const next = { ...prev };
          selectedIds.forEach((id) => {
            if (next[id] && !next[id].locked) {
              next[id] = {
                ...next[id],
                x: next[id].x + deltaX,
                y: next[id].y + deltaY,
              };
            }
          });
          pushHistory(next);
          return next;
        });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Shift") setIsShiftPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleUndo, handleRedo, selectedIds, pushHistory]);

  // Zoom In / Out dengan Ctrl + Scroll Wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomStep = 0.05;
        if (e.deltaY < 0) {
          setScale((prev) => Math.min(2.5, +(prev + zoomStep).toFixed(2)));
        } else {
          setScale((prev) => Math.max(0.1, +(prev - zoomStep).toFixed(2)));
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  // Auto-fit scale on mount and resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const parentWidth = containerRef.current.parentElement?.clientWidth || 800;
        const newScale = Math.min((parentWidth - 120) / canvasWidth, 1);
        setScale(Math.max(0.15, newScale));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvasWidth, canvasHeight]);

  // Sinkronisasi konfigurasi awal
  useEffect(() => {
    const rawFallbackDefaults = isTranscript
      ? (layout === "VERTICAL" ? DEFAULT_TRANSCRIPT_VERTICAL_ELEMENTS : DEFAULT_TRANSCRIPT_HORIZONTAL_ELEMENTS)
      : (layout === "VERTICAL" ? DEFAULT_VERTICAL_ELEMENTS : DEFAULT_HORIZONTAL_ELEMENTS);

    const fallbackDefaults: Record<string, LayoutElement> = { ...rawFallbackDefaults };
    if (institutionLogo && fallbackDefaults.universityLogo) {
      fallbackDefaults.universityLogo = {
        ...fallbackDefaults.universityLogo,
        imageUrl: institutionLogo,
      };
    }
    if (institutionName && fallbackDefaults.universityTitle) {
      fallbackDefaults.universityTitle = {
        ...fallbackDefaults.universityTitle,
        text: institutionName,
      };
    }

    if (initialConfig) {
      const hasWrappedElements = "elements" in initialConfig && (initialConfig as any).elements;
      const loadedElements = (hasWrappedElements ? (initialConfig as any).elements : initialConfig) as Record<string, LayoutElement>;

      const merged: Record<string, LayoutElement> = { ...fallbackDefaults };
      Object.keys(loadedElements).forEach((k) => {
        merged[k] = { ...(merged[k] || {}), ...loadedElements[k] };
      });
      delete merged.background;

      if (institutionLogo && merged.universityLogo && (!merged.universityLogo.imageUrl || merged.universityLogo.imageUrl === "/assets/unesa-logo.png" || merged.universityLogo.imageUrl === "DEFAULT_LOGO")) {
        merged.universityLogo.imageUrl = institutionLogo;
      }
      if (institutionName && merged.universityTitle && (merged.universityTitle.text === "UNIVERSITAS NEGERI SURABAYA")) {
        merged.universityTitle.text = institutionName;
      }

      setElements(merged);

      let initialCustomGroups = {};
      if (hasWrappedElements) {
        const wrapped = initialConfig as CertificateLayoutConfig;
        if (wrapped.customGroups) {
          initialCustomGroups = wrapped.customGroups;
          setCustomGroups(wrapped.customGroups);
        }
        if (wrapped.showDecorativeFrame !== undefined) {
          setShowDecorativeFrame(wrapped.showDecorativeFrame);
        }
        if (wrapped.followTemplateDesign !== undefined) {
          setFollowTemplateDesign(wrapped.followTemplateDesign);
        }
        if (wrapped.layoutMode) {
          setLayoutMode(wrapped.layoutMode);
        }
        if (wrapped.backgroundConfig) {
          setBgConfig({
            ...DEFAULT_BG_CONFIG,
            canvasBgColor: isTranscript ? "#ffffff" : "#0B0F19",
            ...wrapped.backgroundConfig,
          });
          if (wrapped.backgroundConfig.canvasBgColor) {
            setCanvasBgColor(wrapped.backgroundConfig.canvasBgColor);
          }
        }
        if (wrapped.canvasBgColor) setCanvasBgColor(wrapped.canvasBgColor);
        if (wrapped.paperWidthCm) setWidthCm(wrapped.paperWidthCm);
        if (wrapped.paperHeightCm) setHeightCm(wrapped.paperHeightCm);
      }

      setHistory([{ elements: merged, customGroups: initialCustomGroups }]);
      setHistoryIndex(0);
    } else {
      setElements(fallbackDefaults);
      setCustomGroups({});
      setLayoutMode("STANDARD");
      setHistory([{ elements: fallbackDefaults, customGroups: {} }]);
      setHistoryIndex(0);
      setBgConfig({
        ...DEFAULT_BG_CONFIG,
        canvasBgColor: isTranscript ? "#ffffff" : "#0B0F19",
      });
      setCanvasBgColor(isTranscript ? "#ffffff" : "#0B0F19");
      setShowDecorativeFrame(!isTranscript);
      setFollowTemplateDesign(true);
    }
  }, [initialConfig, layout, isTranscript, institutionLogo, institutionName]);

  // Sinkronisasi perubahan props dimensi
  useEffect(() => {
    if (initialWidthCm) setWidthCm(initialWidthCm);
    if (initialHeightCm) setHeightCm(initialHeightCm);
  }, [initialWidthCm, initialHeightCm]);

  // Update elemen tunggal
  const updateElement = useCallback(
    (id: string, updates: Partial<LayoutElement>, recordHistory = true) => {
      setElements((prev) => {
        const next = {
          ...prev,
          [id]: { ...prev[id], ...updates },
        };
        if (recordHistory) {
          pushHistory(next);
        }
        return next;
      });
    },
    [pushHistory]
  );

  // Handler Reset Layout khusus halaman aktif saat ini
  const handleInternalReset = () => {
    const rawFallbackDefaults = isTranscript
      ? (layout === "VERTICAL" ? DEFAULT_TRANSCRIPT_VERTICAL_ELEMENTS : DEFAULT_TRANSCRIPT_HORIZONTAL_ELEMENTS)
      : (layout === "VERTICAL" ? DEFAULT_VERTICAL_ELEMENTS : DEFAULT_HORIZONTAL_ELEMENTS);

    const fallbackDefaults: Record<string, LayoutElement> = { ...rawFallbackDefaults };
    if (institutionLogo && fallbackDefaults.universityLogo) {
      fallbackDefaults.universityLogo = {
        ...fallbackDefaults.universityLogo,
        imageUrl: institutionLogo,
      };
    }
    if (institutionName && fallbackDefaults.universityTitle) {
      fallbackDefaults.universityTitle = {
        ...fallbackDefaults.universityTitle,
        text: institutionName,
      };
    }

    setElements(fallbackDefaults);
    setCustomGroups({});
    setLayoutMode("STANDARD");
    setHistory([{ elements: fallbackDefaults, customGroups: {} }]);
    setHistoryIndex(0);
    setBgConfig({
      ...DEFAULT_BG_CONFIG,
      canvasBgColor: isTranscript ? "#ffffff" : "#0B0F19",
    });
    setCanvasBgColor(isTranscript ? "#ffffff" : "#0B0F19");
    setShowDecorativeFrame(!isTranscript);
    setFollowTemplateDesign(true);
    setSelectedIds([]);

    if (onReset) {
      onReset();
    }
  };

  // Group & Ungroup Handlers
  const handleGroupSelected = () => {
    if (selectedIds.length < 2) return;
    const groupId = `group_${Date.now()}`;
    const groupName = `Grup ${Object.keys(customGroups).length + 1}`;

    const newGroups = {
      ...customGroups,
      [groupId]: { id: groupId, name: groupName, collapsed: false },
    };
    setCustomGroups(newGroups);

    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], groupId };
        }
      });
      pushHistory(next, newGroups);
      return next;
    });
  };

  const handleUngroupSelected = () => {
    if (selectedIds.length === 0) return;
    const affectedGroupIds = new Set<string>();

    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id] && next[id].groupId) {
          affectedGroupIds.add(next[id].groupId!);
          next[id] = { ...next[id], groupId: undefined };
        }
      });

      const updatedGroups = { ...customGroups };
      affectedGroupIds.forEach((gId) => {
        const hasMembers = Object.values(next).some((e) => e.groupId === gId);
        if (!hasMembers) {
          delete updatedGroups[gId];
        }
      });
      setCustomGroups(updatedGroups);
      pushHistory(next, updatedGroups);
      return next;
    });
  };

  // Toggle Collapse / Expand untuk Kategori Layer
  const toggleCategoryCollapse = (catKey: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const handleExpandAllCategories = () => {
    setCollapsedCategories({});
  };

  const handleCollapseAllCategories = () => {
    const allCollapsed: Record<string, boolean> = {
      header: true,
      recipient: true,
      course: true,
      instructor: true,
      verification: true,
      custom: true,
    };
    Object.keys(customGroups).forEach((gId) => {
      allCollapsed[gId] = true;
    });
    setCollapsedCategories(allCollapsed);
  };

  // 1-Klik Ganti Tema Warna Seluruh Teks (Dark Mode vs Light Paper)
  const handleApplyThemePalette = (theme: "dark" | "light") => {
    setElements((prev) => {
      const next = { ...prev };
      if (theme === "light") {
        setCanvasBgColor("#ffffff");
        setShowDecorativeFrame(false);
        setFollowTemplateDesign(false);
        // Terapkan palet teks formal gelap di atas kertas putih
        if (next.universityTitle) next.universityTitle = { ...next.universityTitle, color: "#334155" };
        if (next.certificateTitle) next.certificateTitle = { ...next.certificateTitle, color: "#0284c7" };
        if (next.certIdLabel) next.certIdLabel = { ...next.certIdLabel, color: "#0369a1" };
        if (next.presentedTo) next.presentedTo = { ...next.presentedTo, color: "#0891b2" };
        if (next.studentName) next.studentName = { ...next.studentName, color: "#0f172a" };
        if (next.majorProgram) next.majorProgram = { ...next.majorProgram, color: "#334155" };
        if (next.studentId) next.studentId = { ...next.studentId, color: "#0e7490" };
        if (next.courseSubtitle) next.courseSubtitle = { ...next.courseSubtitle, color: "#64748b" };
        if (next.courseTitle) next.courseTitle = { ...next.courseTitle, color: "#0f172a" };
        if (next.instructorName) next.instructorName = { ...next.instructorName, color: "#0f172a" };
        if (next.instructorLine) next.instructorLine = { ...next.instructorLine, color: "#94a3b8" };
        if (next.instructorTitle) next.instructorTitle = { ...next.instructorTitle, color: "#334155" };
        if (next.instructorNip) next.instructorNip = { ...next.instructorNip, color: "#0369a1" };
        if (next.issuedDateTitle) next.issuedDateTitle = { ...next.issuedDateTitle, color: "#64748b" };
        if (next.issuedDateBox) next.issuedDateBox = { ...next.issuedDateBox, color: "#0f172a" };
        if (next.scanToVerifyLabel) next.scanToVerifyLabel = { ...next.scanToVerifyLabel, color: "#0369a1" };
      } else {
        setCanvasBgColor("#0B0F19");
        setShowDecorativeFrame(true);
        setFollowTemplateDesign(true);
        // Terapkan palet teks terang di atas kertas gelap
        if (next.universityTitle) next.universityTitle = { ...next.universityTitle, color: "#cbd5e1" };
        if (next.certificateTitle) next.certificateTitle = { ...next.certificateTitle, color: "#38bdf8" };
        if (next.certIdLabel) next.certIdLabel = { ...next.certIdLabel, color: "#0ea5e9" };
        if (next.presentedTo) next.presentedTo = { ...next.presentedTo, color: "#67e8f9" };
        if (next.studentName) next.studentName = { ...next.studentName, color: "#ffffff" };
        if (next.majorProgram) next.majorProgram = { ...next.majorProgram, color: "#cbd5e1" };
        if (next.studentId) next.studentId = { ...next.studentId, color: "#06b6d4" };
        if (next.courseSubtitle) next.courseSubtitle = { ...next.courseSubtitle, color: "#94a3b8" };
        if (next.courseTitle) next.courseTitle = { ...next.courseTitle, color: "#ffffff" };
        if (next.instructorName) next.instructorName = { ...next.instructorName, color: "#f8fafc" };
        if (next.instructorLine) next.instructorLine = { ...next.instructorLine, color: "#475569" };
        if (next.instructorTitle) next.instructorTitle = { ...next.instructorTitle, color: "#cbd5e1" };
        if (next.instructorNip) next.instructorNip = { ...next.instructorNip, color: "#38bdf8" };
        if (next.issuedDateTitle) next.issuedDateTitle = { ...next.issuedDateTitle, color: "#94a3b8" };
        if (next.issuedDateBox) next.issuedDateBox = { ...next.issuedDateBox, color: "#f8fafc" };
        if (next.scanToVerifyLabel) next.scanToVerifyLabel = { ...next.scanToVerifyLabel, color: "#0ea5e9" };
      }
      pushHistory(next);
      return next;
    });
  };

  // Ubah seluruh warna teks sekaligus (Global Batch Color)
  const handleGlobalTextColorChange = (color: string) => {
    setElements((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (next[k] && next[k].type === "text") {
          next[k] = { ...next[k], color };
        }
      });
      pushHistory(next);
      return next;
    });
  };

  // Hitung bounding box top-left presisi tinggi
  const getBoxPosition = (el: LayoutElement) => {
    const renderW = el.width || (el.type === "table" ? 1550 : 300);
    const renderH = el.height || (el.type === "table" ? 430 : 40);
    let boxX = el.x;
    let boxY = el.y;

    if (el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      boxX = el.x - renderW / 2;
    } else if (el.align === "right") {
      boxX = el.x - renderW;
    }

    if (el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      boxY = el.y - renderH / 2;
    }

    return { boxX: Math.round(boxX), boxY: Math.round(boxY), renderW, renderH };
  };

  // Handler seleksi elemen
  const handleSelectElement = (id: string, e?: React.MouseEvent | React.SyntheticEvent | any) => {
    const targetEl = elements[id];
    const isMulti = (e as React.MouseEvent)?.ctrlKey || (e as React.MouseEvent)?.metaKey || (e as React.MouseEvent)?.shiftKey;

    if (targetEl?.groupId) {
      const groupMemberIds = Object.keys(elements).filter((k) => elements[k]?.groupId === targetEl.groupId);
      if (isMulti) {
        setSelectedIds((prev) => {
          const already = groupMemberIds.every((gId) => prev.includes(gId));
          return already ? prev.filter((pId) => !groupMemberIds.includes(pId)) : Array.from(new Set([...prev, ...groupMemberIds]));
        });
      } else {
        setSelectedIds(groupMemberIds);
      }
      return;
    }

    if (isMulti) {
      setSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedIds(Object.keys(elements));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Drag Handlers
  const handleDragStart = (id: string, boxX: number, boxY: number, e: any) => {
    const el = elements[id];
    if (el?.locked) return;

    let currentSelected = selectedIds;
    if (!selectedIds.includes(id)) {
      currentSelected = [id];
      setSelectedIds([id]);
    }

    const positions: Record<string, { x: number; y: number }> = {};
    currentSelected.forEach((selId) => {
      if (elements[selId] && !elements[selId].locked) {
        positions[selId] = { x: elements[selId].x, y: elements[selId].y };
      }
    });

    dragTrackerRef.current = {
      draggedId: id,
      mouseStartX: e.clientX || 0,
      mouseStartY: e.clientY || 0,
      startBoxX: boxX,
      startBoxY: boxY,
      initialPositions: positions,
    };
  };

  const handleDrag = (id: string, dX: number, dY: number, el: LayoutElement) => {
    if (!dragTrackerRef.current || el.locked) return;
    const renderW = el.width || (el.type === "table" ? 1550 : 300);
    const renderH = el.height || (el.type === "table" ? 430 : 40);
    let currentCenterX = dX;
    let currentCenterY = dY;

    if (el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      currentCenterX = dX + renderW / 2;
    } else if (el.align === "right") {
      currentCenterX = dX + renderW;
    }

    if (el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      currentCenterY = dY + renderH / 2;
    }

    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    const activeGuides: { x?: number; y?: number } = {};

    if (Math.abs(currentCenterX - canvasCenterX) < 15) activeGuides.x = canvasCenterX;
    if (Math.abs(currentCenterY - canvasCenterY) < 15) activeGuides.y = canvasCenterY;

    // Only update React state if guidelines actually changed to preserve 60 FPS smooth dragging
    if (
      guidelinesRef.current.x !== activeGuides.x ||
      guidelinesRef.current.y !== activeGuides.y
    ) {
      guidelinesRef.current = activeGuides;
      setGuidelines(activeGuides);
    }
  };

  const handleDragStop = (id: string, dX: number, dY: number, el: LayoutElement, e: any) => {
    if (!dragTrackerRef.current) return;
    const { startBoxX, startBoxY, initialPositions } = dragTrackerRef.current;
    dragTrackerRef.current = null;
    guidelinesRef.current = {};
    setGuidelines({});

    const renderW = el.width || (el.type === "table" ? 1550 : 300);
    const renderH = el.height || (el.type === "table" ? 430 : 40);
    let finalCenterX = dX;
    let finalCenterY = dY;

    if (el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      finalCenterX = dX + renderW / 2;
    } else if (el.align === "right") {
      finalCenterX = dX + renderW;
    }

    if (el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table") {
      finalCenterY = dY + renderH / 2;
    }

    const canvasCenterX = canvasWidth / 2;
    const canvasCenterY = canvasHeight / 2;
    if (Math.abs(finalCenterX - canvasCenterX) < 15) finalCenterX = canvasCenterX;
    if (Math.abs(finalCenterY - canvasCenterY) < 15) finalCenterY = canvasCenterY;

    // Apply grid snapping on release if snapToGrid is enabled
    if (snapToGrid && gridSize > 1) {
      finalCenterX = Math.round(finalCenterX / gridSize) * gridSize;
      finalCenterY = Math.round(finalCenterY / gridSize) * gridSize;
    }

    const actualDeltaX = finalCenterX - (initialPositions[id]?.x ?? el.x);
    const actualDeltaY = finalCenterY - (initialPositions[id]?.y ?? el.y);

    setElements((prev) => {
      const next = { ...prev };
      Object.keys(initialPositions).forEach((selId) => {
        if (next[selId] && !next[selId].locked) {
          next[selId] = {
            ...next[selId],
            x: Math.round((initialPositions[selId]?.x ?? next[selId].x) + actualDeltaX),
            y: Math.round((initialPositions[selId]?.y ?? next[selId].y) + actualDeltaY),
          };
        }
      });
      pushHistory(next);
      return next;
    });
  };

  // Lock / Unlock Toggle
  const handleToggleLock = (id: string) => {
    setElements((prev) => {
      if (!prev[id]) return prev;
      const next = {
        ...prev,
        [id]: { ...prev[id], locked: !prev[id].locked },
      };
      pushHistory(next);
      return next;
    });
  };

  // Layer Ordering
  const handleBringToFront = () => {
    if (selectedIds.length === 0) return;
    const maxZ = Math.max(...Object.values(elements).map((e) => e.zIndex || 0), 10);
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id, idx) => {
        if (next[id]) next[id] = { ...next[id], zIndex: maxZ + idx + 1 };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleSendToBack = () => {
    if (selectedIds.length === 0) return;
    const minZ = Math.min(...Object.values(elements).map((e) => e.zIndex || 0), 0);
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id, idx) => {
        if (next[id])
          next[id] = {
            ...next[id],
            zIndex: Math.max(0, minZ - selectedIds.length + idx),
          };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleBringForward = () => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id])
          next[id] = { ...next[id], zIndex: (next[id].zIndex || 10) + 1 };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleSendBackward = () => {
    if (selectedIds.length === 0) return;
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id])
          next[id] = {
            ...next[id],
            zIndex: Math.max(0, (next[id].zIndex || 10) - 1),
          };
      });
      pushHistory(next);
      return next;
    });
  };

  // Alignment Tools Handlers
  const handleAlignLeft = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      const el = elements[id];
      if (!el || el.locked) return;
      const w = el.width || (el.type === "table" ? 1550 : 300);
      const targetX =
        el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
          ? 100 + w / 2
          : 100;
      updateElement(id, { x: Math.round(targetX) });
      return;
    }

    const lefts = selectedIds.map((id) => {
      const el = elements[id];
      if (!el) return 0;
      const w = el.width || (el.type === "table" ? 1550 : 300);
      return el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
        ? el.x - w / 2
        : el.x;
    });
    const minLeft = Math.min(...lefts);

    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const el = next[id];
        if (el && !el.locked) {
          const w = el.width || (el.type === "table" ? 1550 : 300);
          const newX =
            el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
              ? minLeft + w / 2
              : minLeft;
          next[id] = { ...el, x: Math.round(newX) };
        }
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignCenterHorizontal = () => {
    if (selectedIds.length === 0) return;
    const targetX = Math.round(canvasWidth / 2);

    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const el = next[id];
        if (el && !el.locked) {
          if (
            el.align === "center" ||
            el.type === "image" ||
            el.type === "line" ||
            el.type === "shape" ||
            el.type === "table"
          ) {
            next[id] = { ...el, x: targetX };
          } else if (el.align === "left") {
            const w = el.width || 300;
            next[id] = { ...el, x: targetX - Math.round(w / 2) };
          } else if (el.align === "right") {
            const w = el.width || 300;
            next[id] = { ...el, x: targetX + Math.round(w / 2) };
          }
        }
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignRight = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length === 1) {
      const id = selectedIds[0];
      const el = elements[id];
      if (!el || el.locked) return;
      const w = el.width || (el.type === "table" ? 1550 : 300);
      const targetX =
        el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
          ? canvasWidth - 100 - w / 2
          : canvasWidth - 100;
      updateElement(id, { x: Math.round(targetX) });
      return;
    }

    const rights = selectedIds.map((id) => {
      const el = elements[id];
      if (!el) return canvasWidth;
      const w = el.width || (el.type === "table" ? 1550 : 300);
      return el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
        ? el.x + w / 2
        : el.x + w;
    });
    const maxRight = Math.max(...rights);

    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        const el = next[id];
        if (el && !el.locked) {
          const w = el.width || (el.type === "table" ? 1550 : 300);
          const newX =
            el.align === "center" || el.type === "image" || el.type === "line" || el.type === "shape" || el.type === "table"
              ? maxRight - w / 2
              : maxRight - w;
          next[id] = { ...el, x: Math.round(newX) };
        }
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignTop = () => {
    if (selectedIds.length === 0) return;
    const minY = Math.min(...selectedIds.map((id) => elements[id]?.y ?? 0));
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id] && !next[id].locked) next[id] = { ...next[id], y: minY };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignMiddleVertical = () => {
    if (selectedIds.length === 0) return;
    const targetY = Math.round(canvasHeight / 2);
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id] && !next[id].locked)
          next[id] = { ...next[id], y: targetY };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignBottom = () => {
    if (selectedIds.length === 0) return;
    const maxY = Math.max(...selectedIds.map((id) => elements[id]?.y ?? 0));
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id] && !next[id].locked) next[id] = { ...next[id], y: maxY };
      });
      pushHistory(next);
      return next;
    });
  };

  // Text Alignment
  const handleSetTextAlign = (alignment: "left" | "center" | "right") => {
    setElements((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id] && next[id].type === "text") {
          next[id] = { ...next[id], align: alignment };
        }
      });
      pushHistory(next);
      return next;
    });
  };

  // Tambah custom layer teks
  const handleAddTextLayer = () => {
    const id = `customText_${Date.now()}`;
    const newEl: LayoutElement = {
      id,
      type: "text",
      label: "Custom Teks",
      text: "Teks Baru",
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      width: 400,
      height: 40,
      fontSize: 24,
      fontFamily: "Arial",
      color: canvasBgColor === "#ffffff" ? "#0f172a" : "#ffffff",
      colorMode: "solid",
      bold: false,
      italic: false,
      visible: true,
      align: "center",
      isCustom: true,
      locked: false,
      zIndex: Object.keys(elements).length + 10,
    };
    setElements((prev) => {
      const next = { ...prev, [id]: newEl };
      pushHistory(next);
      return next;
    });
    setSelectedIds([id]);
  };

  // Tambah Shape (Kotak, Kotak Bulat, Lingkaran, Badge)
  const handleAddShapeLayer = (shapeType: "rectangle" | "rounded-rect" | "circle" | "badge") => {
    const id = `customShape_${Date.now()}`;
    const shapeLabels = {
      "rectangle": "Kotak Persegi",
      "rounded-rect": "Kotak Bulat",
      "circle": "Bentuk Lingkaran",
      "badge": "Pill / Badge",
    };

    const newEl: LayoutElement = {
      id,
      type: "shape",
      shapeType,
      label: shapeLabels[shapeType] || "Bentuk Geometris",
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      width: shapeType === "circle" ? 160 : shapeType === "badge" ? 300 : 250,
      height: shapeType === "circle" ? 160 : shapeType === "badge" ? 44 : 120,
      fontSize: 0,
      fontFamily: "Arial",
      color: canvasBgColor === "#ffffff" ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.08)",
      fillType: "solid",
      borderColor: canvasBgColor === "#ffffff" ? "#94a3b8" : "#38bdf8",
      borderWidth: 2,
      borderRadius: shapeType === "circle" ? 9999 : shapeType === "rounded-rect" ? 16 : shapeType === "badge" ? 22 : 0,
      opacity: 100,
      bold: false,
      italic: false,
      visible: true,
      isCustom: true,
      locked: false,
      zIndex: 5,
    };

    setElements((prev) => {
      const next = { ...prev, [id]: newEl };
      pushHistory(next);
      return next;
    });
    setSelectedIds([id]);
  };

  // Tambah Tabel Transkrip Kompetensi SKKNI
  const handleAddTableLayer = () => {
    const id = `tableCompetencies_${Date.now()}`;
    const newEl: LayoutElement = {
      id,
      type: "table",
      label: "Tabel Unit Kompetensi SKKNI",
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      width: Math.min(1550, Math.round(canvasWidth * 0.9)),
      height: 430,
      fontSize: 13,
      tableFontSize: 13,
      tableHeaderFontSize: 14,
      fontFamily: "Arial",
      color: "#0f172a",
      tableHeaderBg: "#0f172a",
      tableHeaderColor: "#ffffff",
      tableRowBg: "#ffffff",
      tableRowAltBg: "#f8fafc",
      tableBorderColor: "#cbd5e1",
      tableTextColor: "#0f172a",
      tableScoreColor: "#0f172a",
      bold: false,
      italic: false,
      visible: true,
      isCustom: true,
      locked: false,
      zIndex: Object.keys(elements).length + 10,
      showScoreColumn: true,
      showStandardColumn: true,
      showCodeColumn: true,
      showAverageRow: true,
    };
    setElements((prev) => {
      const next = { ...prev, [id]: newEl };
      pushHistory(next);
      return next;
    });
    setSelectedIds([id]);
  };

  // Tambah custom layer gambar
  const handleAddImageLayer = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || 400;
        const naturalH = img.naturalHeight || 400;

        let initialW = naturalW;
        let initialH = naturalH;

        if (initialW > canvasWidth || initialH > canvasHeight) {
          const scaleDown = Math.min(
            (canvasWidth * 0.95) / initialW,
            (canvasHeight * 0.95) / initialH
          );
          initialW = Math.round(initialW * scaleDown);
          initialH = Math.round(initialH * scaleDown);
        }

        const id = `customImage_${Date.now()}`;
        const newEl: LayoutElement = {
          id,
          type: "image",
          label: file.name.replace(/\.[^/.]+$/, "") || "Gambar Baru",
          imageUrl: dataUrl,
          x: Math.round(canvasWidth / 2),
          y: Math.round(canvasHeight / 2),
          width: initialW,
          height: initialH,
          fontSize: 0,
          fontFamily: "Arial",
          color: "#ffffff",
          bold: false,
          italic: false,
          visible: true,
          lockAspectRatio: true,
          isCustom: true,
          opacity: 100,
          locked: false,
          zIndex: Object.keys(elements).length + 10,
        };
        setElements((prev) => {
          const next = { ...prev, [id]: newEl };
          pushHistory(next);
          return next;
        });
        setSelectedIds([id]);

        // Background upload to Supabase Storage
        (async () => {
          try {
            const formData = new FormData();
            formData.append("image", file);
            const res = await fetch("/api/admin/settings/custom-image", {
              method: "POST",
              body: formData,
            });
            if (res.ok) {
              const data = await res.json();
              if (data.url || data.path) {
                const cloudUrl = data.url || data.path;
                setElements((curr) => {
                  if (curr[id]) {
                    return { ...curr, [id]: { ...curr[id], imageUrl: cloudUrl } };
                  }
                  return curr;
                });
              }
            }
          } catch (e) {}
        })();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // 1-Klik: Jadikan Gambar sebagai Full Background
  const handleSetImageAsBackground = (id: string) => {
    const el = elements[id];
    if (!el || el.type !== "image") return;
    updateElement(id, {
      x: Math.round(canvasWidth / 2),
      y: Math.round(canvasHeight / 2),
      width: canvasWidth,
      height: canvasHeight,
      lockAspectRatio: false,
      zIndex: 0,
    });
  };

  // Ganti gambar layer aktif
  const handleReplaceLayerImage = (file: File) => {
    const primaryId = selectedIds[0];
    if (!primaryId || !elements[primaryId]) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const naturalW = img.naturalWidth || 400;
        const naturalH = img.naturalHeight || 400;
        updateElement(primaryId, {
          imageUrl: dataUrl,
          width: naturalW,
          height: naturalH,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  // Tambah custom layer tanda tangan PNG
  const handleAddSignatureLayer = (file?: File) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const id = `customSignature_${Date.now()}`;
        const newEl: LayoutElement = {
          id,
          type: "image",
          label: "Tanda Tangan PNG",
          imageUrl: dataUrl,
          x: Math.round(canvasWidth / 2),
          y: Math.round(canvasHeight * 0.8),
          width: 150,
          height: 70,
          fontSize: 0,
          fontFamily: "Arial",
          color: "#ffffff",
          bold: false,
          italic: false,
          visible: true,
          lockAspectRatio: true,
          isCustom: true,
          opacity: 100,
          locked: false,
          zIndex: Object.keys(elements).length + 10,
        };
        setElements((prev) => {
          const next = { ...prev, [id]: newEl };
          pushHistory(next);
          return next;
        });
        setSelectedIds([id]);
      };
      reader.readAsDataURL(file);
    } else {
      const id = `customSignature_${Date.now()}`;
      const newEl: LayoutElement = {
        id,
        type: "image",
        label: "Tanda Tangan PNG Baru",
        imageUrl: "",
        x: Math.round(canvasWidth / 2),
        y: Math.round(canvasHeight * 0.8),
        width: 150,
        height: 70,
        fontSize: 0,
        fontFamily: "Arial",
        color: "#ffffff",
        bold: false,
        italic: false,
        visible: true,
        lockAspectRatio: true,
        isCustom: true,
        opacity: 100,
        locked: false,
        zIndex: Object.keys(elements).length + 10,
      };
      setElements((prev) => {
        const next = { ...prev, [id]: newEl };
        pushHistory(next);
        return next;
      });
      setSelectedIds([id]);
    }
  };

  // Tambah cluster penandatangan lengkap (Signature + Nama + Garis + Jabatan + NIP)
  const handleAddSignerCluster = () => {
    let nextNum = 2;
    while (
      elements[`signer${nextNum}Name`] ||
      elements[`signer${nextNum}Signature`] ||
      elements[`signer${nextNum}Title`]
    ) {
      nextNum++;
    }

    const currentSignersCount = Object.keys(elements).filter(
      (k) => (k.startsWith("signer") && k.endsWith("Name")) || k === "instructorName"
    ).length;

    const targetX = Math.min(
      canvasWidth - 250,
      Math.max(250, Math.round((canvasWidth / (currentSignersCount + 1)) * currentSignersCount))
    );
    const targetY = layout === "VERTICAL" ? 1440 : 990;

    const sigKey = `signer${nextNum}Signature`;
    const nameKey = `signer${nextNum}Name`;
    const lineKey = `signer${nextNum}Line`;
    const titleKey = `signer${nextNum}Title`;
    const nipKey = `signer${nextNum}Nip`;

    const newElements: Record<string, LayoutElement> = {
      [sigKey]: {
        id: sigKey,
        type: "image",
        label: `Tanda Tangan Signer ${nextNum} (PNG)`,
        x: targetX,
        y: targetY - 55,
        width: 150,
        height: 70,
        fontSize: 0,
        fontFamily: "Arial",
        color: "#ffffff",
        bold: false,
        italic: false,
        visible: true,
        imageUrl: "",
        lockAspectRatio: true,
        locked: false,
        zIndex: 20 + nextNum,
      },
      [nameKey]: {
        id: nameKey,
        type: "text",
        label: `Nama Penandatangan ${nextNum}`,
        text: `Nama Penandatangan ${nextNum}`,
        x: targetX,
        y: targetY,
        width: 360,
        height: 38,
        fontSize: 22,
        fontFamily: "Arial",
        color: "#f8fafc",
        bold: true,
        italic: true,
        visible: true,
        align: "center",
        locked: false,
        zIndex: 21 + nextNum,
      },
      [lineKey]: {
        id: lineKey,
        type: "line",
        label: `Garis TTD Signer ${nextNum}`,
        x: targetX,
        y: targetY + 40,
        width: 260,
        height: 2,
        fontSize: 0,
        fontFamily: "Arial",
        color: "#475569",
        bold: false,
        italic: false,
        visible: true,
        locked: false,
        zIndex: 22 + nextNum,
      },
      [titleKey]: {
        id: titleKey,
        type: "text",
        label: `Jabatan Signer ${nextNum}`,
        text: "ASESOR MITRA INDUSTRI (DUDI)",
        x: targetX,
        y: targetY + 55,
        width: 340,
        height: 24,
        fontSize: 14,
        fontFamily: "Arial",
        color: "#cbd5e1",
        bold: true,
        italic: false,
        visible: true,
        align: "center",
        locked: false,
        zIndex: 23 + nextNum,
      },
      [nipKey]: {
        id: nipKey,
        type: "text",
        label: `NIP / Instansi Signer ${nextNum}`,
        text: "PT. MITRA INDUSTRI",
        x: targetX,
        y: targetY + 85,
        width: 340,
        height: 24,
        fontSize: 12,
        fontFamily: "Courier New",
        color: "#38bdf8",
        bold: false,
        italic: false,
        visible: true,
        align: "center",
        locked: false,
        zIndex: 24 + nextNum,
      },
    };

    setElements((prev) => {
      const updated = { ...prev, ...newElements };
      pushHistory(updated);
      return updated;
    });
    setSelectedIds([nameKey]);
  };

  // Hapus custom layer
  const handleDeleteLayer = (id: string) => {
    setElements((prev) => {
      const updated = { ...prev };
      delete updated[id];
      pushHistory(updated);
      return updated;
    });
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  // Helper 1-Klik: Ratakan Posisi Penandatangan (1 Signer Tengah vs 2 Signer Kiri & Kanan)
  const handleAlignSignersSingle = () => {
    setElements((prev) => {
      const next = { ...prev };
      const centerX = Math.round(canvasWidth / 2);
      const s1Keys = [
        "instructorSignature", "instructorName", "instructorLine", "instructorTitle", "instructorNip",
        "signer1Signature", "signer1Name", "signer1Line", "signer1Title", "signer1Nip"
      ];
      const s2Keys = [
        "signer2Signature", "signer2Name", "signer2Line", "signer2Title", "signer2Nip"
      ];

      s1Keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], x: centerX, visible: true };
      });
      s2Keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], visible: false };
      });
      pushHistory(next);
      return next;
    });
  };

  const handleAlignSignersDual = () => {
    setElements((prev) => {
      const next = { ...prev };
      const isPortrait = layout === "VERTICAL";
      const leftX = isPortrait ? 320 : 420;
      const rightX = isPortrait ? 920 : 1334;

      const s1Keys = [
        "instructorSignature", "instructorName", "instructorLine", "instructorTitle", "instructorNip",
        "signer1Signature", "signer1Name", "signer1Line", "signer1Title", "signer1Nip"
      ];
      const s2Keys = [
        "signer2Signature", "signer2Name", "signer2Line", "signer2Title", "signer2Nip"
      ];

      s1Keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], x: leftX, visible: true };
      });
      s2Keys.forEach((k) => {
        if (next[k]) next[k] = { ...next[k], x: rightX, visible: true };
      });
      pushHistory(next);
      return next;
    });
  };

  // Toggle visibility untuk seluruh elemen dalam satu kategori / folder
  const handleToggleCategoryVisibility = (keys: string[], e: React.MouseEvent) => {
    e.stopPropagation();
    setElements((prev) => {
      const memberElements = keys.map((k) => prev[k]).filter(Boolean);
      const anyVisible = memberElements.some((el) => el.visible);
      const newVisible = !anyVisible;

      const updated = { ...prev };
      keys.forEach((k) => {
        if (updated[k]) {
          updated[k] = { ...updated[k], visible: newVisible };
        }
      });
      pushHistory(updated);
      return updated;
    });
  };

  // 1-Klik: Switch ke Tab 2: "Template Jadi (Blank Canvas)" (Pre-printed Finished Certificate)
  const handleSetQrOnlyMode = () => {
    setLayoutMode("QR_ONLY");
    setShowDecorativeFrame(false);
    setFollowTemplateDesign(false);
    setElements((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (k !== "qrCode" && k !== "certIdLabel" && !updated[k]?.isCustom) {
          updated[k] = { ...updated[k], visible: false };
        }
      });
      // Pastikan QR code dan certIdLabel menyala (visible)
      if (updated.qrCode) {
        updated.qrCode = {
          ...updated.qrCode,
          visible: true,
          width: updated.qrCode.width || 140,
          height: updated.qrCode.height || 140,
        };
      }
      if (updated.certIdLabel) {
        updated.certIdLabel = {
          ...updated.certIdLabel,
          visible: true,
        };
      }
      pushHistory(updated);
      return updated;
    });
  };

  // 1-Klik: Switch ke Tab 1: "Desain Lengkap" (Semua Teks & Elemen Default Aktif)
  const handleSetFullStandardMode = () => {
    setLayoutMode("STANDARD");
    setShowDecorativeFrame(true);
    setFollowTemplateDesign(true);
    setElements((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((k) => {
        if (!k.startsWith("signer2")) {
          updated[k] = { ...updated[k], visible: true };
        }
      });
      pushHistory(updated);
      return updated;
    });
  };

  // Simpan konfigurasi layout penuh
  const handleSave = () => {
    const fullConfig: CertificateLayoutConfig = {
      paperSize,
      paperWidthCm: finalWidthCm,
      paperHeightCm: finalHeightCm,
      canvasBgColor,
      showDecorativeFrame,
      followTemplateDesign,
      layoutMode,
      backgroundConfig: {
        ...bgConfig,
        canvasBgColor,
      },
      customGroups,
      elements,
    };
    onSave(fullConfig);
  };

  // Helper render thumbnail gambar di sidebar layer
  const renderLayerThumbnail = (el: LayoutElement) => {
    if (
      el.id === "universityLogo" ||
      el.imageUrl === "DEFAULT_LOGO" ||
      el.imageUrl === "/assets/unesa-logo.png"
    ) {
      return (
        <img
          src="/assets/unesa-logo.png"
          alt="Logo"
          className="w-6 h-6 rounded object-contain bg-white/5 p-0.5 border border-white/10 shrink-0"
        />
      );
    }
    if (el.type === "table") {
      return <Table size={15} className="text-emerald-400 shrink-0" />;
    }
    if (el.type === "shape") {
      if (el.shapeType === "circle") return <Circle size={15} className="text-amber-400 shrink-0" />;
      if (el.shapeType === "badge") return <Badge size={15} className="text-amber-400 shrink-0" />;
      return <RectangleHorizontal size={15} className="text-amber-400 shrink-0" />;
    }
    if (el.type === "image") {
      if (el.id === "qrCode") {
        return <QrCode size={16} className="text-cyan-400 shrink-0" />;
      }
      if (el.imageUrl) {
        return (
          <img
            src={el.imageUrl}
            alt={el.label}
            className="w-6 h-6 rounded object-contain bg-white/5 border border-white/10 shrink-0"
          />
        );
      }
      return <ImageIcon size={16} className="text-neon-purple shrink-0" />;
    }
    if (el.type === "text") {
      return <Type size={16} className="text-cyan-400 shrink-0" />;
    }
    return <Minus size={16} className="text-white/40 shrink-0" />;
  };

  // Dynamic extraction of signer keys
  const allElementKeys = Object.keys(elements);
  const signerCategoryKeys = allElementKeys.filter((k) => {
    if (elements[k]?.groupId) return false;
    return (
      k.startsWith("instructor") ||
      k.startsWith("signer") ||
      k.toLowerCase().includes("signature") ||
      k.toLowerCase().includes("ttd") ||
      (elements[k]?.label && (
        elements[k].label.toLowerCase().includes("tanda tangan") ||
        elements[k].label.toLowerCase().includes("penandatangan") ||
        elements[k].label.toLowerCase().includes("instruktur") ||
        elements[k].label.toLowerCase().includes("asesor")
      ))
    );
  });

  // Group elements for organized sidebar display
  const standardCategories = [
    {
      key: "header",
      title: "Header & Judul",
      keys: ["universityLogo", "universityTitle", "certificateTitle", "certificateNumber", "certIdLabel"],
    },
    {
      key: "recipient",
      title: "Penerima Sertifikat",
      keys: ["presentedTo", "studentName", "schoolName", "majorProgram", "studentId"],
    },
    {
      key: "course",
      title: "Materi Pelatihan / UKK",
      keys: ["courseSubtitle", "courseTitle"],
    },
    {
      key: "instructor",
      title: "Penandatangan & TTD Digital",
      keys:
        signerCategoryKeys.length > 0
          ? signerCategoryKeys
          : [
              "instructorSignature",
              "instructorName",
              "instructorLine",
              "instructorTitle",
              "instructorNip",
              "signer2Signature",
              "signer2Name",
              "signer2Line",
              "signer2Title",
              "signer2Nip",
            ],
    },
    {
      key: "verification",
      title: "Tanggal & Verifikasi",
      keys: ["issuedDateTitle", "issuedDateBox", "qrCode", "scanToVerifyLabel"],
    },
  ];

  const transcriptCategories = [
    {
      key: "header",
      title: "Header & Judul Halaman 2",
      keys: ["headerTitle", "subHeaderTitle", "courseSubtitle"],
    },
    {
      key: "recipient",
      title: "Data Siswa & Lembaga",
      keys: ["studentMetaBox", "studentNameMeta", "studentIdMeta", "schoolNameMeta", "majorProgramMeta"],
    },
    {
      key: "table",
      title: "Tabel Kompetensi SKKNI",
      keys: ["tableCompetencies"],
    },
    {
      key: "footer",
      title: "Catatan Kaki & Blockchain",
      keys: ["footerNote", "blockchainHashNote"],
    },
    {
      key: "instructor",
      title: "Penandatangan (Asesor & Kepsek)",
      keys:
        signerCategoryKeys.length > 0
          ? signerCategoryKeys
          : [
              "signer1Title",
              "signer1Signature",
              "signer1Line",
              "signer1Name",
              "signer1Nip",
              "signer2Title",
              "signer2Signature",
              "signer2Line",
              "signer2Name",
              "signer2Nip",
            ],
    },
  ];

  const standardUsedKeys = new Set([
    "universityLogo", "universityTitle", "certificateTitle", "certificateNumber", "certIdLabel",
    "presentedTo", "studentName", "schoolName", "majorProgram", "studentId",
    "courseSubtitle", "courseTitle",
    "issuedDateTitle", "issuedDateBox", "qrCode", "scanToVerifyLabel",
    ...signerCategoryKeys,
  ]);

  const transcriptUsedKeys = new Set([
    "headerTitle", "subHeaderTitle", "courseSubtitle",
    "studentMetaBox", "studentNameMeta", "studentIdMeta", "schoolNameMeta", "majorProgramMeta",
    "tableCompetencies",
    "footerNote", "blockchainHashNote",
    ...signerCategoryKeys,
  ]);

  const activeCategories = isTranscript ? transcriptCategories : standardCategories;
  const activeUsedKeys = isTranscript ? transcriptUsedKeys : standardUsedKeys;

  const customKeys = Object.keys(elements).filter(
    (k) => elements[k]?.isCustom && !activeUsedKeys.has(k)
  );
  const primarySelectedEl = selectedIds.length === 1 ? elements[selectedIds[0]] : null;

  // Render elements in ascending zIndex order (REAL STACKING ORDER)
  const sortedRenderElements = Object.values(elements).sort(
    (a, b) => (a.zIndex || 0) - (b.zIndex || 0)
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Render Row Layer Item
  const renderLayerItem = (key: string, el: LayoutElement, isInsideGroup = false) => {
    const isSelected = selectedIds.includes(key);
    return (
      <div
        key={key}
        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer ${
          isInsideGroup ? "ml-3 border-l-2 border-neon-purple/30 pl-2.5" : ""
        } ${
          isSelected
            ? el.isCustom
              ? "bg-neon-purple/20 border border-neon-purple/50 shadow-sm"
              : "bg-cyan-500/20 border border-cyan-500/50 shadow-sm"
            : "hover:bg-white/5 border border-transparent"
        }`}
        onClick={(e) => handleSelectElement(key, e)}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          {isSelected ? (
            <CheckSquare
              size={14}
              className={
                el.isCustom
                  ? "text-neon-purple shrink-0"
                  : "text-cyan-400 shrink-0"
              }
            />
          ) : (
            <Square size={14} className="text-white/20 shrink-0" />
          )}
          {renderLayerThumbnail(el)}
          <span
            className={`text-xs truncate ${
              isSelected
                ? el.isCustom
                  ? "text-white font-semibold"
                  : "text-cyan-300 font-medium"
                : "text-slate-300"
            }`}
          >
            {el.label || el.id}
          </span>
          <span className="text-[9px] font-mono text-white/30 ml-auto mr-1 shrink-0">
            z:{el.zIndex ?? 10}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(key);
            }}
            className={`p-1 rounded ${
              el.locked
                ? "text-amber-400 hover:text-amber-300"
                : "text-white/30 hover:text-white"
            }`}
            title={el.locked ? "Buka kunci posisi" : "Kunci posisi elemen"}
          >
            {el.locked ? <Lock size={13} /> : <Unlock size={13} />}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateElement(key, { visible: !el.visible });
            }}
            className={`p-1 rounded ${
              el.visible
                ? "text-slate-400 hover:text-white"
                : "text-rose-500 hover:text-rose-400"
            }`}
            title={el.visible ? "Sembunyikan layer" : "Tampilkan layer"}
          >
            {el.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          {el.isCustom && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteLayer(key);
              }}
              className="p-1 text-slate-500 hover:text-red-400 rounded"
              title="Hapus layer"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col xl:flex-row h-[960px] w-full bg-slate-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl relative font-sans select-none">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={layerUploadRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleAddImageLayer(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />
      <input
        type="file"
        ref={imageUploadRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleReplaceLayerImage(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {/* LEFT SIDEBAR: Variable Layers & Shapes with Accordion */}
      <div className="w-full xl:w-80 bg-slate-900 border-r border-white/10 flex flex-col h-full z-10 shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Layers className="text-cyan-400" size={18} />
            <h3 className="text-white text-sm font-bold tracking-tight">
              Daftar Layer
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={
                Object.keys(collapsedCategories).length > 0
                  ? handleExpandAllCategories
                  : handleCollapseAllCategories
              }
              className="text-[10px] text-white/50 hover:text-white px-2 py-0.5 rounded border border-white/10"
              title="Buka / Tutup Semua Folder"
            >
              {Object.keys(collapsedCategories).length > 0
                ? "Buka Semua"
                : "Tutup Semua"}
            </button>
            <button
              type="button"
              onClick={
                selectedIds.length > 0 ? handleDeselectAll : handleSelectAll
              }
              className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 hover:bg-cyan-500/20"
            >
              {selectedIds.length > 0 ? "Batal" : "Pilih Semua"}
            </button>
          </div>
        </div>

        {/* Action Toolbar: Tambah Teks, Gambar, Shape, Tabel, dan Penandatangan */}
        <div className="p-3 border-b border-white/10 space-y-2 bg-slate-950/40">
          <div className={`grid ${isTranscript ? "grid-cols-5" : "grid-cols-4"} gap-1`}>
            <button
              type="button"
              onClick={handleAddTextLayer}
              className="flex items-center justify-center gap-1 py-2 px-1 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-cyan-500/40 transition-colors"
            >
              <Plus size={11} className="text-cyan-400" />
              <span>+ Teks</span>
            </button>
            <button
              type="button"
              onClick={() => layerUploadRef.current?.click()}
              className="flex items-center justify-center gap-1 py-2 px-1 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-neon-purple/40 transition-colors"
              title="Upload Gambar (Bisa dijadikan Logo, Ornamen, maupun Full Background)"
            >
              <Upload size={11} className="text-neon-purple" />
              <span>+ Gambar</span>
            </button>
            <div className="relative group">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1 py-2 px-1 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-amber-500/40 transition-colors"
                title="Tambah Bentuk Geometris (Kotak, Lingkaran, Badge)"
              >
                <Shapes size={11} className="text-amber-400" />
                <span>+ Shape</span>
              </button>
              {/* Dropdown Options for Shape */}
              <div className="absolute left-0 top-full mt-1 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-xl p-1 z-30 hidden group-hover:flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => handleAddShapeLayer("rectangle")}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <RectangleHorizontal size={13} className="text-amber-400" />
                  <span>Persegi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShapeLayer("rounded-rect")}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <Square size={13} className="text-amber-400" />
                  <span>Kotak Bulat</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShapeLayer("badge")}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <Badge size={13} className="text-amber-400" />
                  <span>Pill Badge</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddShapeLayer("circle")}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <Circle size={13} className="text-amber-400" />
                  <span>Lingkaran</span>
                </button>
              </div>
            </div>

            {isTranscript && (
              <button
                type="button"
                onClick={handleAddTableLayer}
                className="flex items-center justify-center gap-1 py-2 px-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
                title="Tambah / Pulihkan Tabel Unit Kompetensi SKKNI"
              >
                <Table size={11} className="text-emerald-400" />
                <span>+ Tabel</span>
              </button>
            )}

            <div className="relative group">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-1 py-2 px-1 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-emerald-500/40 transition-colors"
                title="Tambah Penandatangan Baru atau Tanda Tangan PNG"
              >
                <Boxes size={11} className="text-emerald-400" />
                <span>+ Signer</span>
              </button>
              <div className="absolute right-0 top-full mt-1 w-64 bg-slate-900 border border-white/10 rounded-xl shadow-xl p-1 z-30 hidden group-hover:flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={handleAddSignerCluster}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <Boxes size={13} className="text-emerald-400" />
                  <span>+ Paket Penandatangan Lengkap</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSignatureLayer()}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-white hover:bg-white/10 rounded-lg text-left"
                >
                  <ImageIcon size={13} className="text-cyan-400" />
                  <span>+ Layer Tanda Tangan Saja</span>
                </button>
                <div className="my-1 border-t border-white/10" />
                <button
                  type="button"
                  onClick={handleAlignSignersSingle}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-amber-300 hover:bg-white/10 rounded-lg text-left"
                  title="Posisikan 1 penandatangan di tengah secara simetris"
                >
                  <AlignCenter size={13} className="text-amber-400" />
                  <span>Tata Letak: 1 Penandatangan (Tengah)</span>
                </button>
                <button
                  type="button"
                  onClick={handleAlignSignersDual}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-emerald-300 hover:bg-white/10 rounded-lg text-left"
                  title="Posisikan 2 penandatangan berdampingan (kiri & kanan) secara simetris"
                >
                  <AlignVerticalJustifyStart size={13} className="text-emerald-400" />
                  <span>Tata Letak: 2 Penandatangan (Kiri & Kanan)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Group / Ungroup Quick Buttons */}
          {selectedIds.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleGroupSelected}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded-lg text-[10px] font-bold uppercase border border-neon-purple/40 shadow-sm"
                title="Kelompokkan Layer Terpilih (Ctrl+G)"
              >
                <FolderPlus size={12} />
                <span>Group ({selectedIds.length})</span>
              </button>
              {selectedIds.some((id) => elements[id]?.groupId) && (
                <button
                  type="button"
                  onClick={handleUngroupSelected}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-[10px] font-bold uppercase border border-rose-500/40 shadow-sm"
                  title="Pisahkan Grup (Ctrl+Shift+G)"
                >
                  <FolderMinus size={12} />
                  <span>Ungroup</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Daftar Scroll Layer dengan Collapsible Folders */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
          {/* Custom Uploaded & User Created Groups */}
          {Object.keys(customGroups).map((gId) => {
            const group = customGroups[gId];
            const memberKeys = Object.keys(elements).filter(
              (k) => elements[k]?.groupId === gId,
            );
            if (memberKeys.length === 0) return null;
            const isCollapsed = !!collapsedCategories[gId];
            const memberElements = memberKeys.map((k) => elements[k]).filter(Boolean);
            const allVisible = memberElements.length > 0 && memberElements.every((el) => el.visible);
            const anyVisible = memberElements.some((el) => el.visible);
            const allGroupSelected = memberKeys.length > 0 && memberKeys.every((k) => selectedIds.includes(k));
            const anyGroupSelected = memberKeys.some((k) => selectedIds.includes(k));

            return (
              <div
                key={gId}
                className="border border-neon-purple/30 rounded-2xl p-1.5 bg-neon-purple/5 transition-all"
              >
                <div
                  className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-white/5 rounded-lg select-none"
                  onClick={() => toggleCategoryCollapse(gId)}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {isCollapsed ? (
                      <ChevronRight size={13} className="text-neon-purple shrink-0" />
                    ) : (
                      <ChevronDown size={13} className="text-neon-purple shrink-0" />
                    )}
                    <Folder size={13} className="text-neon-purple shrink-0" />
                    <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate">
                      {group.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] text-white/40 font-mono mr-1">
                      {memberElements.filter((e) => e.visible).length}/{memberKeys.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allGroupSelected) {
                          setSelectedIds((prev) => prev.filter((k) => !memberKeys.includes(k)));
                        } else {
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...memberKeys])));
                        }
                      }}
                      className={`p-1 rounded hover:bg-white/10 ${
                        allGroupSelected
                          ? "text-neon-purple font-bold"
                          : anyGroupSelected
                          ? "text-neon-purple/60"
                          : "text-white/30 hover:text-white"
                      }`}
                      title={allGroupSelected ? "Batalkan pilihan semua layer di grup ini" : "Pilih semua layer di grup ini"}
                    >
                      {allGroupSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleToggleCategoryVisibility(memberKeys, e)}
                      className={`p-1 rounded hover:bg-white/10 ${
                        allVisible
                          ? "text-neon-purple"
                          : anyVisible
                          ? "text-amber-400"
                          : "text-rose-500/70 hover:text-rose-400"
                      }`}
                      title={anyVisible ? "Sembunyikan semua elemen di grup ini" : "Tampilkan semua elemen di grup ini"}
                    >
                      {anyVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1 pl-1">
                    {memberKeys.map((key) =>
                      renderLayerItem(key, elements[key], true),
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Custom Uploaded Independent Layers & Shapes */}
          {customKeys.filter((k) => !elements[k]?.groupId).length > 0 && (() => {
            const independentCustomKeys = customKeys.filter((k) => !elements[k]?.groupId);
            const allCustomSelected = independentCustomKeys.length > 0 && independentCustomKeys.every((k) => selectedIds.includes(k));
            const anyCustomSelected = independentCustomKeys.some((k) => selectedIds.includes(k));

            return (
              <div className="border border-white/5 rounded-2xl p-1.5 bg-white/[0.02]">
                <div
                  className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-white/5 rounded-lg select-none"
                  onClick={() => toggleCategoryCollapse("custom")}
                >
                  <div className="flex items-center gap-1.5">
                    {collapsedCategories["custom"] ? (
                      <ChevronRight size={13} className="text-neon-purple shrink-0" />
                    ) : (
                      <ChevronDown size={13} className="text-neon-purple shrink-0" />
                    )}
                    <h4 className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">
                      ★ Layer Kustom & Shape
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] text-white/30 font-mono mr-1">
                      {independentCustomKeys.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allCustomSelected) {
                          setSelectedIds((prev) => prev.filter((k) => !independentCustomKeys.includes(k)));
                        } else {
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...independentCustomKeys])));
                        }
                      }}
                      className={`p-1 rounded hover:bg-white/10 ${
                        allCustomSelected
                          ? "text-neon-purple font-bold"
                          : anyCustomSelected
                          ? "text-neon-purple/60"
                          : "text-white/30 hover:text-white"
                      }`}
                      title={allCustomSelected ? "Batalkan pilihan semua layer kustom" : "Pilih semua layer kustom"}
                    >
                      {allCustomSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleToggleCategoryVisibility(independentCustomKeys, e)}
                      className="p-1 text-white/40 hover:text-white rounded hover:bg-white/10"
                      title="Toggle seluruh layer kustom"
                    >
                      <Eye size={13} />
                    </button>
                  </div>
                </div>
                {!collapsedCategories["custom"] && (
                  <div className="space-y-1 mt-1 pl-1">
                    {independentCustomKeys.map((key) => {
                      const el = elements[key];
                      if (!el) return null;
                      return renderLayerItem(key, el);
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Standard & Transcript Categories with Folder Accordion & Bulk Eye Toggle */}
          {activeCategories.map((cat) => {
            const memberKeys = cat.keys.filter((k) => !elements[k]?.groupId);
            if (memberKeys.length === 0) return null;
            const isCollapsed = !!collapsedCategories[cat.key];
            const memberElements = memberKeys.map((k) => elements[k]).filter(Boolean);
            const allVisible = memberElements.length > 0 && memberElements.every((el) => el.visible);
            const anyVisible = memberElements.some((el) => el.visible);
            const allCatSelected = memberKeys.length > 0 && memberKeys.every((k) => selectedIds.includes(k));
            const anyCatSelected = memberKeys.some((k) => selectedIds.includes(k));

            return (
              <div
                key={cat.key}
                className="border border-white/5 rounded-2xl p-1.5 bg-white/[0.02] transition-all"
              >
                <div
                  className="flex items-center justify-between px-2 py-1 cursor-pointer hover:bg-white/5 rounded-lg select-none"
                  onClick={() => toggleCategoryCollapse(cat.key)}
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {isCollapsed ? (
                      <ChevronRight size={13} className="text-white/40 shrink-0" />
                    ) : (
                      <ChevronDown size={13} className="text-white/40 shrink-0" />
                    )}
                    <Folder
                      size={13}
                      className={anyVisible ? "text-cyan-400 shrink-0" : "text-white/30 shrink-0"}
                    />
                    <h4
                      className={`text-[10px] font-bold uppercase tracking-wider truncate ${
                        anyVisible ? "text-white/80" : "text-white/40"
                      }`}
                    >
                      {cat.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[9px] text-white/30 font-mono mr-1">
                      {memberElements.filter((e) => e.visible).length}/{memberKeys.length}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (allCatSelected) {
                          setSelectedIds((prev) => prev.filter((k) => !memberKeys.includes(k)));
                        } else {
                          setSelectedIds((prev) => Array.from(new Set([...prev, ...memberKeys])));
                        }
                      }}
                      className={`p-1 rounded hover:bg-white/10 ${
                        allCatSelected
                          ? "text-cyan-400 font-bold"
                          : anyCatSelected
                          ? "text-cyan-400/60"
                          : "text-white/30 hover:text-white"
                      }`}
                      title={allCatSelected ? `Batalkan pilihan semua layer di folder ${cat.title}` : `Pilih semua layer di folder ${cat.title}`}
                    >
                      {allCatSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleToggleCategoryVisibility(memberKeys, e)}
                      className={`p-1 rounded hover:bg-white/10 ${
                        allVisible
                          ? "text-cyan-400"
                          : anyVisible
                          ? "text-amber-400"
                          : "text-rose-500/70 hover:text-rose-400"
                      }`}
                      title={anyVisible ? "Sembunyikan semua elemen di folder ini" : "Tampilkan semua elemen di folder ini"}
                    >
                      {anyVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1 pl-1">
                    {memberKeys.map((key) => {
                      const el = elements[key];
                      if (!el) return null;
                      return renderLayerItem(key, el, true);
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-950">
        {/* Photoshop-Style Workspace Tabs Bar */}
        <div className="flex items-center px-4 pt-2 bg-slate-950 border-b border-white/10 gap-1.5 overflow-x-auto shrink-0 select-none">
          <button
            type="button"
            onClick={handleSetFullStandardMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              layoutMode === "STANDARD"
                ? "bg-slate-900 text-cyan-300 border-cyan-500/40 shadow-sm relative -mb-[1px] z-10"
                : "bg-white/[0.02] text-white/40 border-transparent hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Folder size={14} className={layoutMode === "STANDARD" ? "text-cyan-400" : "text-white/30"} />
            <span>Tab 1: Desain Lengkap (Full Dynamic)</span>
            {layoutMode === "STANDARD" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={handleSetQrOnlyMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-xl text-xs font-bold transition-all border-t border-x ${
              layoutMode === "QR_ONLY"
                ? "bg-slate-900 text-fuchsia-300 border-fuchsia-500/40 shadow-sm relative -mb-[1px] z-10"
                : "bg-white/[0.02] text-white/40 border-transparent hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <QrCode size={14} className={layoutMode === "QR_ONLY" ? "text-fuchsia-400" : "text-white/30"} />
            <span>Tab 2: Template Jadi (Blank Canvas / Canva)</span>
            {layoutMode === "QR_ONLY" && (
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Toolbar Atas */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 bg-white/5 border-b border-white/10 shrink-0 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Undo & Redo Buttons */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-white/10">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={15} />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-white/70"
                title="Redo (Ctrl+Y / Ctrl+Shift+Z)"
              >
                <Redo2 size={15} />
              </button>
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Quick Theme Palettes (1-Klik Switch Dark vs Light Paper) */}
            <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1 hidden sm:inline">
                Preset Tema:
              </span>
              <button
                type="button"
                onClick={() => handleApplyThemePalette("dark")}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  canvasBgColor === "#0B0F19"
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                    : "text-white/50 hover:text-white"
                }`}
                title="Tema Gelap / Dark Mode (Teks Terang)"
              >
                <Moon size={13} />
                <span className="hidden md:inline">Gelap</span>
              </button>
              <button
                type="button"
                onClick={() => handleApplyThemePalette("light")}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                  canvasBgColor === "#ffffff"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "text-white/50 hover:text-white"
                }`}
                title="Tema Terang / Light Paper (Teks Hitam Formal)"
              >
                <Sun size={13} />
                <span className="hidden md:inline">Kertas Putih</span>
              </button>
            </div>

            {/* Switch: Ikuti Desain Template Bawaan (Follow Template Design Toggle) */}
            <button
              type="button"
              onClick={() => {
                const nextState = !followTemplateDesign;
                setFollowTemplateDesign(nextState);
                setShowDecorativeFrame(nextState);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                followTemplateDesign
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                  : "bg-slate-900 text-white/40 border-white/10 hover:text-white"
              }`}
              title="Jika AKTIF: Menggunakan bingkai ganda, pill badges, dan efek bawaan. Jika NONAKTIF: Kanvas murni bersih mengikuti desain Anda sendiri"
            >
              <Sparkles size={13} />
              <span className="hidden md:inline">
                {followTemplateDesign ? "Bingkai: Aktif" : "Bingkai: Bersih"}
              </span>
            </button>

            <div className="w-px h-6 bg-white/10" />

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-white/10">
              <button
                onClick={() =>
                  setScale((s) => Math.max(0.1, +(s - 0.05).toFixed(2)))
                }
                className="text-white/50 hover:text-white p-1"
                title="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>
              <span
                className="text-xs font-mono text-white/80 w-12 text-center"
                title="Gunakan Ctrl + Scroll Mouse untuk Zoom"
              >
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() =>
                  setScale((s) => Math.min(2.5, +(s + 0.05).toFixed(2)))
                }
                className="text-white/50 hover:text-white p-1"
                title="Zoom In"
              >
                <ZoomIn size={15} />
              </button>
            </div>

            {/* Grid & Snap Toggle */}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${
                showGrid
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/30"
                  : "text-white/40 hover:text-white/80 border-transparent"
              }`}
              title="Aktifkan / Matikan Garis Grid"
            >
              <Grid3X3 size={15} />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Paper Dimension Badge & Actions */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-[11px] font-mono text-cyan-400/80 bg-cyan-950/40 px-3 py-1.5 rounded-xl border border-cyan-500/20">
              {finalWidthCm.toFixed(1)} × {finalHeightCm.toFixed(1)} cm (
              {layout === "HORIZONTAL" ? "Landscape" : "Portrait"})
            </span>

            <button
              onClick={handleInternalReset}
              className="px-3.5 py-1.5 text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl border border-white/5"
              title="Kembalikan tata letak halaman ini ke pengaturan default"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Save size={15} /> {isSaving ? "Menyimpan..." : "Simpan Layout"}
            </button>
          </div>
        </div>

        {/* Multi-Selection, Layer Ordering & Alignment Quick Bar */}
        {selectedIds.length > 0 && (
          <div className="bg-slate-900/95 backdrop-blur border-b border-cyan-500/30 px-6 py-2 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 font-mono bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {selectedIds.length}{" "}
                {selectedIds.length === 1
                  ? "Elemen Terpilih"
                  : "Elemen Terpilih"}
              </span>

              {isShiftPressed && (
                <span className="text-[10px] font-bold text-neon-purple bg-neon-purple/10 px-2 py-0.5 rounded border border-neon-purple/20">
                  Shift: Kunci Rasio (X & Y Sync)
                </span>
              )}

              {/* Group / Ungroup Buttons on Selection Bar */}
              {selectedIds.length > 1 && (
                <button
                  type="button"
                  onClick={handleGroupSelected}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/40"
                  title="Kelompokkan Elemen (Ctrl+G)"
                >
                  <Boxes size={13} /> Group
                </button>
              )}
              {selectedIds.some((id) => elements[id]?.groupId) && (
                <button
                  type="button"
                  onClick={handleUngroupSelected}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40"
                  title="Pisahkan Grup (Ctrl+Shift+G)"
                >
                  <FolderMinus size={13} /> Ungroup
                </button>
              )}

              {/* Lock Button for Selected Elements */}
              <button
                type="button"
                onClick={() =>
                  selectedIds.forEach((id) => handleToggleLock(id))
                }
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/80 border border-white/10"
                title="Kunci / Buka Kunci Elemen Terpilih"
              >
                {selectedIds.some((id) => elements[id]?.locked) ? (
                  <>
                    <Unlock size={13} className="text-amber-400" /> Buka Kunci
                  </>
                ) : (
                  <>
                    <Lock size={13} className="text-white/60" /> Kunci Objek
                  </>
                )}
              </button>
            </div>

            {/* Layer Ordering */}
            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1 hidden sm:inline">
                Layer:
              </span>
              <button
                type="button"
                onClick={handleBringToFront}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Bawa ke Paling Depan (Top Layer)"
              >
                <ChevronsUp size={15} />
              </button>
              <button
                type="button"
                onClick={handleBringForward}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Maju 1 Layer (+1)"
              >
                <ArrowUp size={15} />
              </button>
              <button
                type="button"
                onClick={handleSendBackward}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Mundur 1 Layer (-1)"
              >
                <ArrowDown size={15} />
              </button>
              <button
                type="button"
                onClick={handleSendToBack}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Kirim ke Paling Belakang (Behind All Objects / Background)"
              >
                <ChevronsDown size={15} />
              </button>
            </div>

            {/* Alignment Tools */}
            <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-xl border border-white/10">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mr-1 hidden sm:inline">
                Ratakan:
              </span>
              <button
                type="button"
                onClick={handleAlignLeft}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Rata Kiri"
              >
                <AlignLeft size={15} />
              </button>
              <button
                type="button"
                onClick={handleAlignCenterHorizontal}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Rata Tengah Horizontal (Canvas Center)"
              >
                <AlignCenter size={15} />
              </button>
              <button
                type="button"
                onClick={handleAlignRight}
                className="p-1.5 rounded-lg text-white/70 hover:text-cyan-400 hover:bg-white/10"
                title="Rata Kanan"
              >
                <AlignRight size={15} />
              </button>

              <div className="w-px h-4 bg-white/15 mx-1" />

              <button
                type="button"
                onClick={handleAlignTop}
                className="p-1.5 rounded-lg text-white/70 hover:text-neon-purple hover:bg-white/10"
                title="Rata Atas"
              >
                <AlignVerticalJustifyStart size={15} />
              </button>
              <button
                type="button"
                onClick={handleAlignMiddleVertical}
                className="p-1.5 rounded-lg text-white/70 hover:text-neon-purple hover:bg-white/10"
                title="Rata Tengah Vertikal"
              >
                <AlignVerticalJustifyCenter size={15} />
              </button>
              <button
                type="button"
                onClick={handleAlignBottom}
                className="p-1.5 rounded-lg text-white/70 hover:text-neon-purple hover:bg-white/10"
                title="Rata Bawah"
              >
                <AlignVerticalJustifyEnd size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Editor Main Canvas Workspace */}
        <div
          ref={containerRef}
          className="flex-1 relative overflow-auto bg-slate-950/80 p-8 custom-scrollbar flex items-center justify-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedIds([]);
            }
          }}
        >
          {/* Scaled Artboard Container Wrapper */}
          <div
            className="relative shrink-0 m-auto"
            style={{
              width: Math.round(canvasWidth * scale),
              height: Math.round(canvasHeight * scale),
            }}
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedIds([]);
              }
            }}
          >
            {/* Paper Frame Canvas */}
            <div
              className="relative shadow-[0_25px_80px_rgba(0,0,0,0.95)] select-none border-2 border-cyan-500/30 rounded-sm shrink-0 overflow-hidden"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                backgroundColor: canvasBgColor,
              }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                  setSelectedIds([]);
                }
              }}
            >
              {/* Latar Belakang Gambar Template Kustom (Jika Diunggah) */}
              {bgPath && (
                <div
                  className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0"
                  style={{ opacity: bgConfig.opacity !== undefined ? bgConfig.opacity / 100 : 1 }}
                >
                  {bgConfig.fitMode === "stretch" ? (
                    <img src={bgPath} alt="Background Template" className="w-full h-full object-fill" crossOrigin="anonymous" />
                  ) : bgConfig.fitMode === "cover" ? (
                    <img src={bgPath} alt="Background Template" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : bgConfig.fitMode === "contain" ? (
                    <img src={bgPath} alt="Background Template" className="w-full h-full object-contain" crossOrigin="anonymous" />
                  ) : (
                    <img
                      src={bgPath}
                      alt="Background Template"
                      crossOrigin="anonymous"
                      style={{
                        width: `${bgConfig.scaleX ?? 100}%`,
                        height: `${bgConfig.scaleY ?? 100}%`,
                        transform: `translate(${bgConfig.offsetX ?? 0}px, ${bgConfig.offsetY ?? 0}px)`,
                        objectFit: "fill",
                      }}
                    />
                  )}
                </div>
              )}

              {/* Latar Belakang & Bingkai Dekoratif Standar (Hanya jika followTemplateDesign & showDecorativeFrame aktif) */}
              {followTemplateDesign && showDecorativeFrame && (
                <div className="absolute inset-0 pointer-events-none z-0">
                  {canvasBgColor === "#0B0F19" && (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#0B0F19] to-blue-950" />
                  )}
                  <div className="absolute inset-8 border-2 border-cyan-500/60 pointer-events-none" />
                  <div className="absolute inset-12 border border-sky-400/40 pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.2)]" />
                  <div className="absolute top-8 left-8 w-10 h-10 border-t-4 border-l-4 border-cyan-400 pointer-events-none" />
                  <div className="absolute top-8 right-8 w-10 h-10 border-t-4 border-r-4 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-8 left-8 w-10 h-10 border-b-4 border-l-4 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-8 right-8 w-10 h-10 border-b-4 border-r-4 border-cyan-400 pointer-events-none" />
                </div>
              )}

              {/* Grid Overlay */}
              {showGrid && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage:
                      canvasBgColor === "#ffffff" || canvasBgColor === "#fefbf3"
                        ? `linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)`
                        : `linear-gradient(to right, rgba(14, 165, 233, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(14, 165, 233, 0.15) 1px, transparent 1px)`,
                    backgroundSize: `${gridSize}px ${gridSize}px`,
                    zIndex: 2,
                  }}
                />
              )}

              {/* Guidelines Garis Bantu */}
              {guidelines.x && (
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-fuchsia-500 z-50 pointer-events-none shadow-[0_0_8px_#d946ef]"
                  style={{ left: guidelines.x }}
                />
              )}
              {guidelines.y && (
                <div
                  className="absolute left-0 right-0 h-[2px] bg-fuchsia-500 z-50 pointer-events-none shadow-[0_0_8px_#d946ef]"
                  style={{ top: guidelines.y }}
                />
              )}

              {/* Semua Elemen: Menghormati REAL Z-INDEX */}
              {sortedRenderElements.map((el) => {
                const isSelected = selectedIds.includes(el.id);
                if (!el.visible && !isSelected) return null;

                const { boxX, boxY, renderW, renderH } = getBoxPosition(el);

                return (
                  <Rnd
                    key={el.id}
                    scale={scale}
                    position={{ x: boxX, y: boxY }}
                    size={{ width: renderW, height: renderH }}
                    lockAspectRatio={el.lockAspectRatio || isShiftPressed}
                    onDragStart={(e, d) => {
                      handleSelectElement(el.id, e);
                      handleDragStart(el.id, boxX, boxY, e);
                    }}
                    onDrag={(e, d) => handleDrag(el.id, d.x, d.y, el)}
                    onDragStop={(e, d) =>
                      handleDragStop(el.id, d.x, d.y, el, e)
                    }
                    onResizeStop={(e, dir, ref, delta, position) => {
                      if (el.locked) return;
                      const newW = parseInt(ref.style.width);
                      const newH = parseInt(ref.style.height);
                      let newCenterX = position.x;
                      let newCenterY = position.y;

                      if (
                        el.align === "center" ||
                        el.type === "image" ||
                        el.type === "line" ||
                        el.type === "shape" ||
                        el.type === "table"
                      ) {
                        newCenterX = position.x + newW / 2;
                      } else if (el.align === "right") {
                        newCenterX = position.x + newW;
                      }

                      if (
                        el.type === "image" ||
                        el.type === "line" ||
                        el.type === "shape" ||
                        el.type === "table"
                      ) {
                        newCenterY = position.y + newH / 2;
                      }

                      updateElement(el.id, {
                        width: newW,
                        height: newH,
                        x: Math.round(newCenterX),
                        y: Math.round(newCenterY),
                      });
                    }}
                    dragGrid={[1, 1]}
                    disableDragging={el.locked}
                    enableResizing={!el.locked ? undefined : false}
                    enableUserSelectHack={false}
                    style={{
                      zIndex: el.zIndex !== undefined ? el.zIndex : 10,
                      transition: "none",
                      willChange: "transform",
                    }}
                    className={`group ${el.locked ? "cursor-default" : "cursor-move"}`}
                  >
                    <div
                      className={`relative w-full h-full flex items-center ${
                        el.align === "center"
                          ? "justify-center"
                          : el.align === "right"
                            ? "justify-end"
                            : "justify-start"
                      }`}
                      style={{
                        opacity: el.visible
                          ? el.opacity !== undefined
                            ? el.opacity / 100
                            : 1
                          : 0.3,
                        outline: isSelected ? "2px solid #00e5ff" : "none",
                        outlineOffset: "2px",
                        backgroundColor: isSelected
                          ? "rgba(0, 229, 255, 0.08)"
                          : "transparent",
                        transition: "none",
                      }}
                    >
                      {/* Locked Indicator Badge */}
                      {el.locked && (
                        <div className="absolute -top-3 -right-3 p-1 bg-slate-900 rounded border border-amber-400 text-amber-400 z-20 pointer-events-none shadow-md">
                          <Lock size={10} />
                        </div>
                      )}

                      {/* Text Element Render dengan Dukungan Gradasi & Glow */}
                      {el.type === "text" && (
                        <div
                          style={{
                            fontFamily: el.fontFamily,
                            fontSize: `${el.fontSize}px`,
                            fontWeight: el.bold ? "bold" : "normal",
                            fontStyle: el.italic ? "italic" : "normal",
                            textAlign: el.align || "left",
                            whiteSpace: "nowrap",
                            color: el.colorMode === "gradient" ? "transparent" : el.color,
                            backgroundImage:
                              el.colorMode === "gradient"
                                ? `linear-gradient(to right, ${el.color}, ${el.gradientColor2 || "#38bdf8"})`
                                : undefined,
                            WebkitBackgroundClip: el.colorMode === "gradient" ? "text" : undefined,
                            filter: el.hasGlow
                              ? `drop-shadow(0 0 ${el.glowBlur || 12}px ${el.glowColor || el.color})`
                              : undefined,
                          }}
                          className="pointer-events-none leading-none select-none relative"
                        >
                          {followTemplateDesign && el.id === "presentedTo" && (
                            <div
                              className={`absolute inset-0 -mx-5 -my-2 rounded-full -z-10 ${
                                canvasBgColor === "#ffffff"
                                  ? "bg-slate-100 border border-slate-300"
                                  : "bg-slate-900 border border-cyan-900"
                              }`}
                            />
                          )}
                          {followTemplateDesign && el.id === "issuedDateBox" && (
                            <div
                              className={`absolute inset-0 -mx-5 -my-2.5 rounded-xl -z-10 ${
                                canvasBgColor === "#ffffff"
                                  ? "bg-slate-100 border border-slate-300"
                                  : "bg-slate-900 border border-white/5"
                              }`}
                            />
                          )}
                          {el.text}
                        </div>
                      )}

                      {/* Shape Element Render (Kotak, Lingkaran, Badge) */}
                      {el.type === "shape" && (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            backgroundColor: el.fillType === "none" ? "transparent" : el.color,
                            backgroundImage:
                              el.fillType === "gradient"
                                ? `linear-gradient(to bottom right, ${el.color}, ${el.gradientColor2 || "#38bdf8"})`
                                : undefined,
                            border: el.borderWidth ? `${el.borderWidth}px solid ${el.borderColor || "transparent"}` : "none",
                            borderRadius:
                              el.shapeType === "circle"
                                ? "9999px"
                                : el.borderRadius !== undefined
                                ? `${el.borderRadius}px`
                                : el.shapeType === "badge"
                                ? "9999px"
                                : el.shapeType === "rounded-rect"
                                ? "16px"
                                : "0px",
                          }}
                          className="pointer-events-none shadow-sm"
                        />
                      )}

                      {/* Table Element Render (Tabel Kompetensi Transkrip Halaman 2) */}
                      {el.type === "table" && (
                        <div
                          className="w-full h-full flex flex-col pointer-events-none rounded-xl overflow-hidden shadow-sm border select-none"
                          style={{
                            borderColor: el.tableBorderColor || "#cbd5e1",
                            backgroundColor: el.tableRowBg || "#ffffff",
                            fontFamily: el.fontFamily || "Arial",
                          }}
                        >
                          <table className="w-full border-collapse text-left" style={{ height: "100%" }}>
                            <thead>
                              <tr
                                style={{
                                  backgroundColor: el.tableHeaderBg || "#0f172a",
                                  color: el.tableHeaderColor || "#ffffff",
                                  fontSize: `${el.tableHeaderFontSize || 14}px`,
                                  fontWeight: el.bold !== undefined ? (el.bold ? "bold" : "normal") : "bold",
                                  fontStyle: el.italic ? "italic" : "normal",
                                }}
                              >
                                <th className="py-2.5 px-3 border-r text-center w-12" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                  NO
                                </th>
                                {el.showCodeColumn !== false && (
                                  <th className="py-2.5 px-3 border-r w-48 font-mono" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                    KODE UNIT
                                  </th>
                                )}
                                <th className="py-2.5 px-3 border-r" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                  JUDUL UNIT KOMPETENSI
                                </th>
                                {el.showStandardColumn !== false && (
                                  <th className="py-2.5 px-3 border-r text-center w-36" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                    STANDAR
                                  </th>
                                )}
                                {el.showScoreColumn !== false && (
                                  <th className="py-2.5 px-3 text-center w-24" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                    NILAI
                                  </th>
                                )}
                              </tr>
                            </thead>
                            <tbody
                              style={{
                                fontSize: `${el.tableFontSize || 13}px`,
                                color: el.tableTextColor || "#0f172a",
                                fontWeight: el.bold ? "bold" : "normal",
                                fontStyle: el.italic ? "italic" : "normal",
                              }}
                            >
                              {[
                                { no: "1", code: "J.620100.004.01", title: "Menerapkan Prinsip-prinsip Keselamatan dan Kesehatan Kerja Lingkungan", standard: "SKKNI", score: "88" },
                                { no: "2", code: "J.620100.005.02", title: "Menulis Kode dengan Prinsip Terstruktur & Clean Architecture", standard: "SKKNI", score: "92" },
                                { no: "3", code: "J.620100.012.01", title: "Mengimplementasikan Rancangan Entitas dan Basis Data Relasional", standard: "SKKNI", score: "90" },
                                { no: "4", code: "J.620100.017.02", title: "Membuat Desain Antarmuka Pengguna (UI/UX) Terintegrasi Modern", standard: "SKKNI", score: "95" },
                                { no: "5", code: "J.620100.025.02", title: "Melakukan Pengujian Unit Perangkat Lunak (Automated Testing)", standard: "SKKNI", score: "89" },
                              ].map((row, idx) => (
                                <tr
                                  key={row.no}
                                  className="border-t"
                                  style={{
                                    borderColor: el.tableBorderColor || "#cbd5e1",
                                    backgroundColor: idx % 2 === 1 ? (el.tableRowAltBg || "#f8fafc") : (el.tableRowBg || "#ffffff"),
                                  }}
                                >
                                  <td className="py-2 px-3 border-r text-center font-bold" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                    {row.no}
                                  </td>
                                  {el.showCodeColumn !== false && (
                                    <td className="py-2 px-3 border-r font-mono text-[11px]" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                      {row.code}
                                    </td>
                                  )}
                                  <td className="py-2 px-3 border-r font-medium truncate" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                    {row.title}
                                  </td>
                                  {el.showStandardColumn !== false && (
                                    <td className="py-2 px-3 border-r text-center text-[11px] font-semibold text-slate-500" style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}>
                                      {row.standard}
                                    </td>
                                  )}
                                  {el.showScoreColumn !== false && (
                                    <td
                                      className="py-2 px-3 text-center font-bold font-mono"
                                      style={{
                                        borderColor: el.tableBorderColor || "#cbd5e1",
                                        color: el.tableScoreColor || el.tableTextColor || "#0f172a",
                                      }}
                                    >
                                      {row.score}
                                    </td>
                                  )}
                                </tr>
                              ))}
                              {el.showAverageRow !== false && (
                                <tr
                                  className="border-t font-bold"
                                  style={{
                                    borderColor: el.tableBorderColor || "#cbd5e1",
                                    backgroundColor: el.tableRowAltBg || "#f1f5f9",
                                  }}
                                >
                                  <td
                                    colSpan={
                                      1 +
                                      (el.showCodeColumn !== false ? 1 : 0) +
                                      1 +
                                      (el.showStandardColumn !== false ? 1 : 0)
                                    }
                                    className="py-2 px-4 text-right tracking-wider uppercase text-[11px] border-r"
                                    style={{ borderColor: el.tableBorderColor || "#cbd5e1" }}
                                  >
                                    NILAI RATA-RATA / PREDIKAT
                                  </td>
                                  {el.showScoreColumn !== false && (
                                    <td
                                      className="py-2 px-3 text-center font-bold font-mono text-emerald-600"
                                      style={{ color: el.tableScoreColor || "#059669" }}
                                    >
                                      90.8
                                    </td>
                                  )}
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Line Element Render */}
                      {el.type === "line" && (
                        <div className="w-full h-full flex items-center justify-center pointer-events-none">
                          <div
                            style={{
                              width: el.width || 260,
                              height: el.height || 2,
                              backgroundColor: el.color,
                            }}
                          />
                        </div>
                      )}

                      {/* Image / Logo / Floating Background Layer Render */}
                      {el.type === "image" && (
                        <div className="w-full h-full flex items-center justify-center pointer-events-none relative rounded-xl overflow-hidden">
                          {el.id === "qrCode" ? (
                            <div
                              className="w-full h-full flex items-center justify-center bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm"
                              style={{
                                filter: el.hasGlow
                                  ? `drop-shadow(0 0 ${el.glowBlur || 12}px ${el.glowColor || "#38bdf8"})`
                                  : undefined,
                                opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
                              }}
                            >
                              <QrCode
                                size={el.width ? el.width * 0.8 : 90}
                                className="text-slate-900 w-full h-full"
                              />
                            </div>
                          ) : el.id === "universityLogo" ||
                            el.imageUrl === "/assets/unesa-logo.png" ||
                            el.imageUrl === "DEFAULT_LOGO" ? (
                            <img
                              src="/assets/unesa-logo.png"
                              alt="Logo Universitas"
                              className="w-full h-full object-contain filter drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                            />
                          ) : el.imageUrl ? (
                            <img
                              src={el.imageUrl}
                              alt={el.label || "Layer image"}
                              className="w-full h-full object-contain"
                            />
                          ) : el.id.includes("Signature") || el.label?.toLowerCase().includes("tanda tangan") ? (
                            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-cyan-400/50 bg-cyan-950/20 rounded-xl text-cyan-300 p-1 text-center select-none">
                              <span className="text-[10px] font-bold uppercase tracking-wider">
                                ✍️ {el.label || "Tanda Tangan PNG"}
                              </span>
                              <span className="text-[8px] text-cyan-400/60 mt-0.5">
                                Belum ada PNG (Ganti Berkas)
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center border-2 border-cyan-500/50 bg-cyan-950/40 rounded-2xl text-cyan-300 p-2 text-center">
                              <ImageIcon size={el.width ? el.width / 3 : 36} />
                              <span className="text-[10px] font-bold mt-1 uppercase tracking-wider">
                                {el.label || "Logo"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Rnd>
                );
              })}
            </div>
          </div>
        </div>

        {/* Panel Properti Bawah — Kompak, Responsif, & Kaya Fitur */}
        <div
          className="min-h-[88px] max-h-[105px] shrink-0 border-t border-white/10 bg-slate-900 px-4 py-2 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-center z-10"
          style={{ transition: "none" }}
        >
          {primarySelectedEl ? (
            <div className="w-full flex items-center justify-between gap-4 flex-nowrap min-w-max">
              {/* Element Title & Meta */}
              <div className="flex flex-col justify-center gap-0.5 shrink-0 pr-3 border-r border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider max-w-[140px] truncate" title={primarySelectedEl.label || primarySelectedEl.id}>
                    {primarySelectedEl.label || primarySelectedEl.id}
                  </span>
                  {primarySelectedEl.locked && (
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                      <Lock size={8} /> Kunci
                    </span>
                  )}
                  {primarySelectedEl.isCustom && (
                    <span className="text-[8px] bg-neon-purple/20 text-neon-purple px-1 py-0.2 rounded font-mono font-bold">
                      KUSTOM
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/50 font-mono">
                  {primarySelectedEl.type.toUpperCase()} · X:{primarySelectedEl.x} Y:{primarySelectedEl.y} · Z:{primarySelectedEl.zIndex || 0}
                </span>
              </div>

              {/* Text Properties (Solid vs Gradasi + Glow + Primary Swatches) */}
              {primarySelectedEl.type === "text" && (
                <div className="flex items-center gap-4 flex-nowrap">
                  {/* Perataan */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Perataan
                    </span>
                    <div className="flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => handleSetTextAlign("left")}
                        className={`p-1 rounded ${
                          primarySelectedEl.align === "left"
                            ? "bg-cyan-500 text-slate-950"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="Rata Kiri"
                      >
                        <AlignLeft size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetTextAlign("center")}
                        className={`p-1 rounded ${
                          primarySelectedEl.align === "center"
                            ? "bg-cyan-500 text-slate-950"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="Rata Tengah"
                      >
                        <AlignCenter size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetTextAlign("right")}
                        className={`p-1 rounded ${
                          primarySelectedEl.align === "right"
                            ? "bg-cyan-500 text-slate-950"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="Rata Kanan"
                      >
                        <AlignRight size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Ukuran Font */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Ukuran Font
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="10"
                        max="200"
                        value={primarySelectedEl.fontSize}
                        onChange={(e) =>
                          updateElement(primarySelectedEl.id, {
                            fontSize: Number(e.target.value),
                          })
                        }
                        className="w-18 accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="8"
                          max="250"
                          value={primarySelectedEl.fontSize}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val > 0) {
                              updateElement(primarySelectedEl.id, { fontSize: val });
                            }
                          }}
                          className="w-10 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                      </div>
                    </div>
                  </div>

                  {/* Jenis Font */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Font
                    </span>
                    <select
                      value={primarySelectedEl.fontFamily}
                      onChange={(e) =>
                        updateElement(primarySelectedEl.id, {
                          fontFamily: e.target.value,
                        })
                      }
                      className="bg-slate-950 border border-white/10 text-xs text-white px-2 py-1 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>

                  {/* Bold & Italic */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Gaya
                    </span>
                    <div className="flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            bold: !primarySelectedEl.bold,
                          })
                        }
                        className={`px-2 py-0.5 text-xs font-serif rounded ${
                          primarySelectedEl.bold
                            ? "bg-cyan-500 text-slate-950 font-bold"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            italic: !primarySelectedEl.italic,
                          })
                        }
                        className={`px-2 py-0.5 text-xs font-serif rounded ${
                          primarySelectedEl.italic
                            ? "bg-cyan-500 text-slate-950 italic"
                            : "text-white/50 hover:text-white"
                        }`}
                      >
                        I
                      </button>
                    </div>
                  </div>

                  {/* Mode Warna: Solid vs Gradasi */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Mode Warna
                    </span>
                    <div className="flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { colorMode: "solid" })}
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          primarySelectedEl.colorMode !== "gradient" ? "bg-cyan-500 text-slate-950" : "text-white/50 hover:text-white"
                        }`}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            colorMode: "gradient",
                            gradientColor2: primarySelectedEl.gradientColor2 || "#38bdf8",
                          })
                        }
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          primarySelectedEl.colorMode === "gradient" ? "bg-cyan-500 text-slate-950" : "text-white/50 hover:text-white"
                        }`}
                      >
                        Gradasi
                      </button>
                    </div>
                  </div>

                  {/* Warna Teks (Solid / Gradasi) & Primary Swatches */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      {primarySelectedEl.colorMode === "gradient" ? "Gradasi (W1 & W2)" : "Warna Teks"}
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Utama"
                      />
                      {primarySelectedEl.colorMode === "gradient" && (
                        <input
                          type="color"
                          value={primarySelectedEl.gradientColor2 || "#38bdf8"}
                          onChange={(e) => updateElement(primarySelectedEl.id, { gradientColor2: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                          title="Warna Gradasi Kedua"
                        />
                      )}
                      <input
                        type="text"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-16 bg-transparent text-xs text-white px-0.5 py-0.5 font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Primary Color Swatches Box */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Palet Primer
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                      {PRIMARY_SWATCHES.slice(0, 7).map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => updateElement(primarySelectedEl.id, { color: swatch.color })}
                          style={{ backgroundColor: swatch.color }}
                          className="w-4 h-4 rounded-md border border-white/20 hover:scale-110 transition-transform"
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Glow Toggle */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Glow Neon
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateElement(primarySelectedEl.id, {
                          hasGlow: !primarySelectedEl.hasGlow,
                          glowColor: primarySelectedEl.glowColor || primarySelectedEl.color,
                        })
                      }
                      className={`px-2 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap ${
                        primarySelectedEl.hasGlow
                          ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                          : "text-white/40 border-white/10"
                      }`}
                    >
                      {primarySelectedEl.hasGlow ? "Glow ON" : "Glow OFF"}
                    </button>
                  </div>

                  {/* Isi Teks Kustom */}
                  {primarySelectedEl.isCustom && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                        Isi Teks
                      </span>
                      <input
                        type="text"
                        value={primarySelectedEl.text || ""}
                        onChange={(e) =>
                          updateElement(primarySelectedEl.id, {
                            text: e.target.value,
                          })
                        }
                        className="w-36 bg-slate-950 border border-white/10 text-xs text-white px-2 py-1 rounded-lg font-medium outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Shape Properties (Persegi, Kotak Bulat, Lingkaran, Badge) */}
              {primarySelectedEl.type === "shape" && (
                <div className="flex items-center gap-4 flex-nowrap">
                  {/* Lebar & Tinggi */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Lebar (W)
                    </span>
                    <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                      <input
                        type="number"
                        min="10"
                        max="3000"
                        value={primarySelectedEl.width || 100}
                        onChange={(e) => updateElement(primarySelectedEl.id, { width: Number(e.target.value) })}
                        className="w-14 bg-transparent text-xs text-white font-mono text-center outline-none"
                      />
                      <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Tinggi (H)
                    </span>
                    <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                      <input
                        type="number"
                        min="10"
                        max="3000"
                        value={primarySelectedEl.height || 100}
                        onChange={(e) => updateElement(primarySelectedEl.id, { height: Number(e.target.value) })}
                        className="w-14 bg-transparent text-xs text-white font-mono text-center outline-none"
                      />
                      <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                    </div>
                  </div>

                  {/* Warna Fill & Swatches */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Warna Isi (Fill)
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="text"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-16 bg-transparent text-xs text-white px-0.5 py-0.5 font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Primary Swatches for Shape Fill */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Palet Fill
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                      {PRIMARY_SWATCHES.slice(0, 6).map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => updateElement(primarySelectedEl.id, { color: swatch.color })}
                          style={{ backgroundColor: swatch.color }}
                          className="w-4 h-4 rounded-md border border-white/20 hover:scale-110 transition-transform"
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Border Stroke Color & Width */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Garis Tepi (Border)
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.borderColor || "#38bdf8"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { borderColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={primarySelectedEl.borderWidth !== undefined ? primarySelectedEl.borderWidth : 2}
                        onChange={(e) => updateElement(primarySelectedEl.id, { borderWidth: Number(e.target.value) })}
                        className="w-8 bg-transparent text-xs text-white font-mono text-center outline-none"
                        title="Tebal Border (px)"
                      />
                      <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                    </div>
                  </div>

                  {/* Corner Radius (khusus persegi / rounded rect) */}
                  {primarySelectedEl.shapeType !== "circle" && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                        Radius Sudut
                      </span>
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={primarySelectedEl.borderRadius !== undefined ? primarySelectedEl.borderRadius : 16}
                          onChange={(e) => updateElement(primarySelectedEl.id, { borderRadius: Number(e.target.value) })}
                          className="w-10 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                      </div>
                    </div>
                  )}

                  {/* Opasitas Shape */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Opasitas
                    </span>
                    <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={primarySelectedEl.opacity !== undefined ? primarySelectedEl.opacity : 100}
                        onChange={(e) => updateElement(primarySelectedEl.id, { opacity: Number(e.target.value) })}
                        className="w-9 bg-transparent text-xs text-white font-mono text-center outline-none"
                      />
                      <span className="text-[10px] text-white/40 font-mono pr-0.5">%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Image & QR Code Properties: Generalized */}
              {primarySelectedEl.type === "image" && (
                <div className="flex items-center gap-4 flex-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Lebar (W)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="30"
                        max={3000}
                        value={primarySelectedEl.width || 100}
                        onChange={(e) => {
                          const newW = Number(e.target.value);
                          if ((primarySelectedEl.lockAspectRatio || isShiftPressed) && primarySelectedEl.width && primarySelectedEl.height) {
                            const ratio = primarySelectedEl.height! / primarySelectedEl.width!;
                            updateElement(primarySelectedEl.id, { width: newW, height: Math.round(newW * ratio) });
                          } else {
                            updateElement(primarySelectedEl.id, { width: newW });
                          }
                        }}
                        className="w-20 accent-neon-purple cursor-pointer"
                      />
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="10"
                          max="4000"
                          value={primarySelectedEl.width || 100}
                          onChange={(e) => {
                            const newW = Number(e.target.value);
                            if (!isNaN(newW) && newW > 0) {
                              if ((primarySelectedEl.lockAspectRatio || isShiftPressed) && primarySelectedEl.width && primarySelectedEl.height) {
                                const ratio = primarySelectedEl.height! / primarySelectedEl.width!;
                                updateElement(primarySelectedEl.id, { width: newW, height: Math.round(newW * ratio) });
                              } else {
                                updateElement(primarySelectedEl.id, { width: newW });
                              }
                            }
                          }}
                          className="w-14 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Tinggi (H)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="30"
                        max={3000}
                        value={primarySelectedEl.height || 100}
                        onChange={(e) => {
                          const newH = Number(e.target.value);
                          if ((primarySelectedEl.lockAspectRatio || isShiftPressed) && primarySelectedEl.width && primarySelectedEl.height) {
                            const ratio = primarySelectedEl.width! / primarySelectedEl.height!;
                            updateElement(primarySelectedEl.id, { height: newH, width: Math.round(newH * ratio) });
                          } else {
                            updateElement(primarySelectedEl.id, { height: newH });
                          }
                        }}
                        className="w-20 accent-neon-purple cursor-pointer"
                      />
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="10"
                          max="4000"
                          value={primarySelectedEl.height || 100}
                          onChange={(e) => {
                            const newH = Number(e.target.value);
                            if (!isNaN(newH) && newH > 0) {
                              if ((primarySelectedEl.lockAspectRatio || isShiftPressed) && primarySelectedEl.width && primarySelectedEl.height) {
                                const ratio = primarySelectedEl.width! / primarySelectedEl.height!;
                                updateElement(primarySelectedEl.id, { height: newH, width: Math.round(newH * ratio) });
                              } else {
                                updateElement(primarySelectedEl.id, { height: newH });
                              }
                            }
                          }}
                          className="w-14 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Opasitas
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={primarySelectedEl.opacity !== undefined ? primarySelectedEl.opacity : 100}
                        onChange={(e) => updateElement(primarySelectedEl.id, { opacity: Number(e.target.value) })}
                        className="w-16 accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={primarySelectedEl.opacity !== undefined ? primarySelectedEl.opacity : 100}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val >= 0 && val <= 100) {
                              updateElement(primarySelectedEl.id, { opacity: val });
                            }
                          }}
                          className="w-9 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Rasio
                    </span>
                    <button
                      type="button"
                      onClick={() => updateElement(primarySelectedEl.id, { lockAspectRatio: !primarySelectedEl.lockAspectRatio })}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold whitespace-nowrap ${
                        primarySelectedEl.lockAspectRatio
                          ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/40"
                          : "text-white/40 border-white/10 hover:text-white"
                      }`}
                      title="Kunci / Buka Kunci Proporsi X & Y"
                    >
                      {primarySelectedEl.lockAspectRatio ? <Lock size={12} /> : <Unlock size={12} />}
                      <span>Sync</span>
                    </button>
                  </div>

                  {primarySelectedEl.id !== "qrCode" && (
                    <>
                      {/* Quick Size Presets */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                          Preset Ukuran
                        </span>
                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                          <button
                            type="button"
                            onClick={() => updateElement(primarySelectedEl.id, { width: 120, height: 55 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded"
                            title="Kecil (120x55 px)"
                          >
                            120x55
                          </button>
                          <button
                            type="button"
                            onClick={() => updateElement(primarySelectedEl.id, { width: 150, height: 70 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded"
                            title="Standar TTD (150x70 px)"
                          >
                            150x70
                          </button>
                          <button
                            type="button"
                            onClick={() => updateElement(primarySelectedEl.id, { width: 180, height: 85 })}
                            className="px-1.5 py-0.5 text-[10px] bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded"
                            title="Besar (180x85 px)"
                          >
                            180x85
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                          Latar Penuh
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSetImageAsBackground(primarySelectedEl.id)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple rounded-lg text-xs font-semibold border border-neon-purple/40 whitespace-nowrap shadow-sm"
                          title="Jadikan Background: Fit Kanvas Penuh & Layer Paling Dasar (Z: 0)"
                        >
                          <Maximize size={12} />
                          <span>Background Kanvas</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                          Berkas Gambar / PNG
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => imageUploadRef.current?.click()}
                            className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/40 whitespace-nowrap shadow-sm"
                            title="Upload atau Ganti Berkas PNG Transparan"
                          >
                            <Upload size={12} />
                            <span>{primarySelectedEl.imageUrl ? "Ganti PNG" : "Unggah PNG"}</span>
                          </button>
                          {primarySelectedEl.imageUrl && (
                            <button
                              type="button"
                              onClick={() => updateElement(primarySelectedEl.id, { imageUrl: "" })}
                              className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/30"
                              title="Hapus gambar dari layer ini"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Line Properties */}
              {primarySelectedEl.type === "line" && (
                <div className="flex items-center gap-4 flex-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Panjang Garis
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        value={primarySelectedEl.width || 260}
                        onChange={(e) => updateElement(primarySelectedEl.id, { width: Number(e.target.value) })}
                        className="w-24 accent-cyan-500 cursor-pointer"
                      />
                      <div className="flex items-center bg-slate-950 rounded-lg border border-white/10 px-1 py-0.5">
                        <input
                          type="number"
                          min="10"
                          max="2000"
                          value={primarySelectedEl.width || 260}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && val > 0) updateElement(primarySelectedEl.id, { width: val });
                          }}
                          className="w-12 bg-transparent text-xs text-white font-mono text-center outline-none"
                        />
                        <span className="text-[10px] text-white/40 font-mono pr-0.5">px</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Warna Garis
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                      />
                      <input
                        type="text"
                        value={primarySelectedEl.color}
                        onChange={(e) => updateElement(primarySelectedEl.id, { color: e.target.value })}
                        className="w-16 bg-transparent text-xs text-white px-0.5 py-0.5 font-mono outline-none"
                      />
                    </div>
                  </div>

                  {/* Primary Swatches for Line */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Palet Garis
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                      {PRIMARY_SWATCHES.slice(0, 6).map((swatch) => (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => updateElement(primarySelectedEl.id, { color: swatch.color })}
                          style={{ backgroundColor: swatch.color }}
                          className="w-4 h-4 rounded-md border border-white/20 hover:scale-110 transition-transform"
                          title={swatch.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Table Properties (Khusus Tabel Transkrip Halaman 2) */}
              {primarySelectedEl.type === "table" && (
                <div className="flex items-center gap-3.5 flex-nowrap overflow-x-auto max-w-full pb-1">
                  {/* Jenis Font Tabel (Font Family) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Font Tabel
                    </span>
                    <select
                      value={primarySelectedEl.fontFamily || "Arial"}
                      onChange={(e) => updateElement(primarySelectedEl.id, { fontFamily: e.target.value })}
                      className="bg-slate-950 border border-white/10 text-xs text-white px-2 py-1 rounded-lg outline-none cursor-pointer"
                      title="Pilih Jenis Font untuk Seluruh Isi Tabel Transkrip"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                      <option value="Montserrat">Montserrat</option>
                      <option value="Inter">Inter</option>
                    </select>
                  </div>

                  {/* Gaya Font: Tebal & Miring */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Gaya Teks
                    </span>
                    <div className="flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-white/10">
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { bold: !primarySelectedEl.bold })}
                        className={`px-2 py-0.5 text-xs font-serif rounded ${
                          primarySelectedEl.bold
                            ? "bg-cyan-500 text-slate-950 font-bold"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="Tebalkan Teks Tabel"
                      >
                        B
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { italic: !primarySelectedEl.italic })}
                        className={`px-2 py-0.5 text-xs font-serif rounded ${
                          primarySelectedEl.italic
                            ? "bg-cyan-500 text-slate-950 italic"
                            : "text-white/50 hover:text-white"
                        }`}
                        title="Miringkan Teks Tabel"
                      >
                        I
                      </button>
                    </div>
                  </div>

                  {/* Ukuran Font Header & Isi */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Ukuran Font (Hdr & Isi)
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-white/40">Hdr:</span>
                        <input
                          type="number"
                          min="8"
                          max="36"
                          value={primarySelectedEl.tableHeaderFontSize || 14}
                          onChange={(e) => updateElement(primarySelectedEl.id, { tableHeaderFontSize: Number(e.target.value) })}
                          className="w-7 bg-transparent text-xs text-white font-mono text-center outline-none border-b border-white/10"
                          title="Ukuran Font Header Tabel"
                        />
                      </div>
                      <div className="w-px h-3 bg-white/20" />
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-white/40">Isi:</span>
                        <input
                          type="number"
                          min="8"
                          max="32"
                          value={primarySelectedEl.tableFontSize || 13}
                          onChange={(e) => updateElement(primarySelectedEl.id, { tableFontSize: Number(e.target.value) })}
                          className="w-7 bg-transparent text-xs text-white font-mono text-center outline-none border-b border-white/10"
                          title="Ukuran Font Baris Isi Tabel"
                        />
                      </div>
                      <span className="text-[10px] text-white/40 font-mono">px</span>
                    </div>
                  </div>

                  {/* Header Color & Background */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Header Bg & Teks
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.tableHeaderBg || "#0f172a"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableHeaderBg: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Latar Header Tabel"
                      />
                      <input
                        type="color"
                        value={primarySelectedEl.tableHeaderColor || "#ffffff"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableHeaderColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Teks Header Tabel"
                      />
                      <span className="text-[10px] text-white/50 font-mono">Hdr</span>
                    </div>
                  </div>

                  {/* Row Bg & Row Alt Bg */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Baris (Ganjil/Genap)
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.tableRowBg || "#ffffff"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableRowBg: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Latar Baris Ganjil"
                      />
                      <input
                        type="color"
                        value={primarySelectedEl.tableRowAltBg || "#f8fafc"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableRowAltBg: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Latar Baris Genap (Belang)"
                      />
                      <span className="text-[10px] text-white/50 font-mono">Row</span>
                    </div>
                  </div>

                  {/* Border, Text, & Score Color */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Garis, Teks, & Nilai
                    </span>
                    <div className="flex items-center gap-1.5 bg-slate-950 px-1.5 py-0.5 rounded-lg border border-white/10">
                      <input
                        type="color"
                        value={primarySelectedEl.tableBorderColor || "#cbd5e1"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableBorderColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Garis Tabel"
                      />
                      <input
                        type="color"
                        value={primarySelectedEl.tableTextColor || "#0f172a"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableTextColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Teks Isi Tabel"
                      />
                      <input
                        type="color"
                        value={primarySelectedEl.tableScoreColor || "#0f172a"}
                        onChange={(e) => updateElement(primarySelectedEl.id, { tableScoreColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer bg-transparent border-0 p-0"
                        title="Warna Angka Nilai"
                      />
                      <span className="text-[10px] text-white/50 font-mono">Clr</span>
                    </div>
                  </div>

                  {/* Preset Tema Cepat Tabel */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Preset Tema Tabel
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            tableHeaderBg: "#0f172a",
                            tableHeaderColor: "#ffffff",
                            tableRowBg: "#ffffff",
                            tableRowAltBg: "#f8fafc",
                            tableBorderColor: "#cbd5e1",
                            tableTextColor: "#0f172a",
                            tableScoreColor: "#0f172a",
                          })
                        }
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-800 text-cyan-300 rounded border border-white/10 hover:bg-slate-700"
                        title="Tema Navy Formal (Default)"
                      >
                        Navy
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            tableHeaderBg: "#064e3b",
                            tableHeaderColor: "#ffffff",
                            tableRowBg: "#ffffff",
                            tableRowAltBg: "#ecfdf5",
                            tableBorderColor: "#a7f3d0",
                            tableTextColor: "#064e3b",
                            tableScoreColor: "#059669",
                          })
                        }
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-950 text-emerald-300 rounded border border-emerald-500/30 hover:bg-emerald-900"
                        title="Tema Emerald Hijau"
                      >
                        Emerald
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            tableHeaderBg: "#78350f",
                            tableHeaderColor: "#ffffff",
                            tableRowBg: "#fffbeb",
                            tableRowAltBg: "#fef3c7",
                            tableBorderColor: "#fde68a",
                            tableTextColor: "#78350f",
                            tableScoreColor: "#b45309",
                          })
                        }
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-950 text-amber-300 rounded border border-amber-500/30 hover:bg-amber-900"
                        title="Tema Gold Mewah"
                      >
                        Gold
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateElement(primarySelectedEl.id, {
                            tableHeaderBg: "#18181b",
                            tableHeaderColor: "#ffffff",
                            tableRowBg: "#ffffff",
                            tableRowAltBg: "#f4f4f5",
                            tableBorderColor: "#e4e4e7",
                            tableTextColor: "#18181b",
                            tableScoreColor: "#18181b",
                          })
                        }
                        className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 text-zinc-300 rounded border border-white/10 hover:bg-zinc-700"
                        title="Tema Minimal Bersih"
                      >
                        Clean
                      </button>
                    </div>
                  </div>

                  {/* Toggle Kolom */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap">
                      Tampilkan Kolom
                    </span>
                    <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-white/10">
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { showCodeColumn: primarySelectedEl.showCodeColumn === false })}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          primarySelectedEl.showCodeColumn !== false ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-white/40"
                        }`}
                        title="Toggle Kolom Kode Unit"
                      >
                        Kode
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { showStandardColumn: primarySelectedEl.showStandardColumn === false })}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          primarySelectedEl.showStandardColumn !== false ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-white/40"
                        }`}
                        title="Toggle Kolom Standar SKKNI"
                      >
                        Standar
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { showScoreColumn: primarySelectedEl.showScoreColumn === false })}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          primarySelectedEl.showScoreColumn !== false ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40" : "text-white/40"
                        }`}
                        title="Toggle Kolom Nilai Angka"
                      >
                        Nilai
                      </button>
                      <button
                        type="button"
                        onClick={() => updateElement(primarySelectedEl.id, { showAverageRow: primarySelectedEl.showAverageRow === false })}
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                          primarySelectedEl.showAverageRow !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "text-white/40"
                        }`}
                        title="Toggle Baris Nilai Rata-rata"
                      >
                        Rata²
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tombol Hapus Custom Layer */}
              {primarySelectedEl.isCustom && (
                <div className="flex flex-col gap-1 ml-auto shrink-0 pl-2">
                  <span className="text-[9px] text-white/40 uppercase font-bold tracking-widest whitespace-nowrap opacity-0">
                    Aksi
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLayer(primarySelectedEl.id)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white rounded-lg text-xs font-semibold border border-red-500/30 whitespace-nowrap"
                  >
                    <Trash2 size={12} />
                    <span>Hapus Layer</span>
                  </button>
                </div>
              )}
            </div>
          ) : selectedIds.length > 1 ? (
            <div className="w-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-cyan-400 shrink-0" />
                <span className="text-xs text-white font-semibold whitespace-nowrap">
                  {selectedIds.length} Layer Sedang Dipilih
                </span>
                <span className="text-[11px] text-white/40 hidden md:inline">
                  (Gunakan tombol Group untuk menggabungkan, atau perataan & urutan layer di atas)
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleGroupSelected}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-neon-purple bg-neon-purple/20 hover:bg-neon-purple/30 rounded-lg border border-neon-purple/40"
                >
                  <Boxes size={12} /> Group (Ctrl+G)
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg"
                >
                  Batalkan
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-center text-white/30 text-xs font-medium gap-2 py-1">
              <Layers size={15} className="text-white/20 shrink-0" />
              <span className="truncate">
                Klik elemen pada kanvas atau daftar layer di samping untuk menyesuaikan ukuran, font, warna, gradasi, shape, atau urutan layer. Tahan <b>Shift</b> saat resize untuk mengunci rasio X & Y.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
