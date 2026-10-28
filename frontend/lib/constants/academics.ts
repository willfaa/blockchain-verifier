// Data Spektrum Keahlian SMK (Program Keahlian -> Konsentrasi Keahlian)
export const ACADEMIC_DATA: Record<string, string[]> = {
  // --- BIDANG TEKNOLOGI INFORMASI ---
  "Pengembangan Perangkat Lunak dan Gim": [
    "Rekayasa Perangkat Lunak",
    "Pengembangan Gim",
    "Sistem Informasi, Jaringan, dan Aplikasi",
  ],
  "Teknik Jaringan Komputer dan Telekomunikasi": [
    "Teknik Komputer dan Jaringan",
    "Teknik Jaringan Akses Telekomunikasi",
    "Teknik Transmisi Telekomunikasi",
  ],

  // --- BIDANG BISNIS DAN MANAJEMEN ---
  "Akuntansi dan Keuangan Lembaga": [
    "Akuntansi",
    "Layanan Perbankan",
    "Layanan Perbankan Syariah",
  ],
  "Manajemen Perkantoran dan Layanan Bisnis": [
    "Manajemen Perkantoran",
    "Logistik",
  ],
  Pemasaran: [
    "Bisnis Digital",
    "Bisnis Retail",
  ],

  // --- BIDANG SENI DAN EKONOMI KREATIF ---
  "Desain Komunikasi Visual": [
    "Desain Komunikasi Visual",
    "Animasi",
    "Teknik Grafika",
  ],
  "Broadcasting dan Perfilman": [
    "Produksi dan Siaran Program Televisi",
    "Produksi Film",
  ],

  // --- BIDANG TEKNOLOGI MANUFAKTUR DAN REKAYASA ---
  "Teknik Otomotif": [
    "Teknik Kendaraan Ringan",
    "Teknik Sepeda Motor",
    "Teknik Alat Berat",
  ],
  "Teknik Mesin": [
    "Teknik Pemesinan",
    "Teknik Pengelasan",
    "Teknik Mekatronika",
  ],
  "Teknik Elektronika": [
    "Teknik Audio Video",
    "Teknik Elektronika Industri",
    "Teknik Otomasi Industri",
  ],
  "Teknik Ketenagalistrikan": [
    "Teknik Instalasi Tenaga Listrik",
    "Teknik Pembangkit Tenaga Listrik",
  ],

  // --- BIDANG PARIWISATA ---
  Kuliner: ["Kuliner"],
  Perhotelan: ["Perhotelan"],
  "Usaha Layanan Wisata": ["Usaha Layanan Wisata"],
};

// Daftar Program Keahlian (Tingkat Umum / Induk)
export const PROGRAMS = Object.keys(ACADEMIC_DATA);

// Mengambil daftar Konsentrasi Keahlian (Tingkat Spesifik) berdasarkan Program Keahlian
export const getConcentrationsByProgram = (program: string | null) => {
  if (!program || program === "All Programs" || program === "All Majors") {
    return Array.from(new Set(Object.values(ACADEMIC_DATA).flat())).sort();
  }
  return ACADEMIC_DATA[program] || [];
};

// Alias kompatibilitas
export const MAJORITIES = PROGRAMS;
export const getProgramsByMajor = getConcentrationsByProgram;
