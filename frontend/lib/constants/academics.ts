export const ACADEMIC_DATA: Record<string, string[]> = {
  // --- FAKULTAS TEKNIK (FT) ---
  "Teknik Informatika": [
    "S1 Pendidikan Teknologi Informasi",
    "S1 Teknik Informatika",
    "S1 Sistem Informasi",
    "D4 Manajemen Informatika",
    "S1 Sains Data",
  ],
  "Teknik Elektro": [
    "S1 Teknik Elektro",
    "S1 Pendidikan Teknik Elektro",
    "D4 Teknik Listrik",
    "S1 Teknik Komputer",
  ],
  "Teknik Mesin": [
    "S1 Teknik Mesin",
    "S1 Pendidikan Teknik Mesin",
    "D3 Teknik Mesin",
    "S1 Teknik Otomotif",
  ],
  "Teknik Sipil": [
    "S1 Teknik Sipil",
    "S1 Pendidikan Teknik Bangunan",
    "D3 Teknik Sipil",
    "S1 Arsitektur",
  ],
  "Pendidikan Kesejahteraan Keluarga": [
    "S1 Pendidikan Tata Boga",
    "S1 Pendidikan Tata Busana",
    "S1 Gizi",
    "D4 Tata Boga",
    "D4 Desain Mode",
  ],

  // --- FAKULTAS MATEMATIKA & IPA (FMIPA) ---
  Matematika: ["S1 Pendidikan Matematika", "S1 Matematika", "S1 Statistika"],
  Fisika: ["S1 Pendidikan Fisika", "S1 Fisika"],
  Kimia: ["S1 Pendidikan Kimia", "S1 Kimia"],
  Biologi: ["S1 Pendidikan Biologi", "S1 Biologi"],
  Sains: ["S1 Pendidikan Sains"],

  // --- FAKULTAS ILMU PENDIDIKAN (FIP) ---
  "Ilmu Pendidikan": [
    "S1 Pendidikan Guru Sekolah Dasar (PGSD)",
    "S1 Psikologi",
    "S1 Bimbingan & Konseling",
    "S1 Teknologi Pendidikan",
    "S1 Pendidikan Luar Biasa",
    "S1 Pendidikan Anak Usia Dini",
  ],

  // --- FAKULTAS BAHASA DAN SENI (FBS) ---
  "Bahasa & Sastra": [
    "S1 Pendidikan Bahasa Inggris",
    "S1 Sastra Inggris",
    "S1 Pendidikan Bahasa Indonesia",
    "S1 Sastra Indonesia",
    "S1 Pendidikan Bahasa Jawa",
    "S1 Pendidikan Bahasa Jepang",
    "S1 Pendidikan Bahasa Jerman",
    "S1 Pendidikan Bahasa Mandarin",
  ],
  Seni: [
    "S1 Pendidikan Seni Rupa",
    "S1 Seni Rupa Murni",
    "S1 Desain Komunikasi Visual (DKV)",
    "S1 Pendidikan Seni Drama, Tari, dan Musik (Sendratasik)",
    "S1 Seni Musik",
  ],

  // --- FAKULTAS EKONOMIKA DAN BISNIS (FEB) ---
  Ekonomi: [
    "S1 Manajemen",
    "S1 Akuntansi",
    "S1 Pendidikan Ekonomi",
    "S1 Pendidikan Administrasi Perkantoran",
    "S1 Pendidikan Tata Niaga",
    "S1 Ekonomi Islam",
    "D4 Administrasi Negara",
  ],

  // --- FAKULTAS ILMU SOSIAL DAN HUKUM (FISH) ---
  "Ilmu Sosial": [
    "S1 Hukum",
    "S1 Sosiologi",
    "S1 Ilmu Komunikasi",
    "S1 Pendidikan Pancasila dan Kewarganegaraan",
    "S1 Pendidikan Sejarah",
    "S1 Pendidikan Geografi",
    "S1 Administrasi Negara",
  ],

  // --- FAKULTAS ILMU OLAHRAGA (FIO) ---
  Olahraga: [
    "S1 Pendidikan Jasmani, Kesehatan, dan Rekreasi",
    "S1 Ilmu Keolahragaan",
    "S1 Pendidikan Kepelatihan Olahraga",
  ],

  // --- LAINNYA ---
  "Mata Kuliah Umum": ["Semua Jurusan"],
};

export const MAJORITIES = Object.keys(ACADEMIC_DATA); // List of Majors/Faculties
export const getProgramsByMajor = (major: string | null) => {
  if (!major || major === "All Majors") {
    // Return all unique programs flat
    return Array.from(new Set(Object.values(ACADEMIC_DATA).flat())).sort();
  }
  return ACADEMIC_DATA[major] || [];
};
