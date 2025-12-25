import xlsx from "xlsx-js-style";

// --- TEMPLATE GENERATION ---
export const generateQuestionTemplate = (): Buffer => {
  // --- 1. SUSUNAN DATA (Sesuai File Upload Kamu) ---
  const allRows = [
    [], // Baris 1: Kosong
    ["TEMPLATE SOAL UJIAN"], // Baris 2: Judul
    [], // Baris 3: Kosong
    [
      // Baris 4: Header
      "No",
      "Question Text",
      "Option A",
      "Option B",
      "Option C",
      "Option D",
      "Correct Answer (A/B/C/D)",
    ],
    [
      // Baris 5: Contoh Data
      1,
      "Siapakah penemu bola lampu?",
      "Tesla",
      "Einstein",
      "Edison",
      "Newton",
      "C",
    ],
  ];

  // Buat Sheet dari array data
  const ws = xlsx.utils.aoa_to_sheet(allRows);

  // --- 2. ATUR LEBAR KOLOM (Agar tulisan tidak terpotong) ---
  ws["!cols"] = [
    { wch: 5 }, // No
    { wch: 50 }, // Question Text (Lebar)
    { wch: 20 }, // Opt A
    { wch: 20 }, // Opt B
    { wch: 20 }, // Opt C
    { wch: 20 }, // Opt D
    { wch: 25 }, // Correct Answer
  ];

  // --- 3. MERGE CELL JUDUL ---
  // Menggabungkan Baris 2 (Index 1) dari Kolom A (0) sampai G (6)
  ws["!merges"] = [{ s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }];

  // --- 4. STYLING (WARNA & BORDER) ---

  // A. Style Judul (Tengah & Tebal)
  const titleCell = xlsx.utils.encode_cell({ r: 1, c: 0 }); // Sel A2
  if (ws[titleCell]) {
    ws[titleCell].s = {
      font: { sz: 14, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  // B. Style Header (Biru, Teks Putih, Border)
  const headerRowIndex = 3; // Baris ke-4 (Index 3)
  const totalCols = 7; // Jumlah kolom (No s/d Answer)

  for (let c = 0; c < totalCols; c++) {
    const cellAddress = xlsx.utils.encode_cell({ r: headerRowIndex, c: c });

    if (ws[cellAddress]) {
      ws[cellAddress].s = {
        font: { bold: true, color: { rgb: "FFFFFF" } }, // Putih
        fill: { fgColor: { rgb: "4472C4" } }, // Biru Excel Standar
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      };
    }
  }

  // --- 5. EXPORT ---
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Template");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

// --- PARSING ---
export interface ParsedQuestion {
  text: string;
  points: number;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

export const parseQuestionFile = (buffer: Buffer): ParsedQuestion[] => {
  const wb = xlsx.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Convert to JSON (Array of Arrays to skip header simpler, or Object)
  // Let's use json with header:1 (array of arrays)
  const rows: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1 });

  // Remove header
  // Structure:
  // Row 0: []
  // Row 1: [TITLE]
  // Row 2: []
  // Row 3: [No, Question, ...] (HEADERS)
  // Row 4: [1, "Who...", ...] (DATA)

  // We should find the header row or assume filtering.
  // Simple heuristic: Slice from index 4.
  const dataRows = rows.slice(4);

  const parsedQuestions: ParsedQuestion[] = [];

  dataRows.forEach((row) => {
    // New Index Map (based on custom template)
    // 0: No
    // 1: Question Text
    // 2: Opt A
    // 3: Opt B
    // 4: Opt C
    // 5: Opt D
    // 6: Correct Answer

    const qText = row[1];
    if (!qText) return; // Skip empty rows

    const optA = row[2];
    const optB = row[3];
    const optC = row[4];
    const optD = row[5];
    const correctLetter = (row[6] || "").toString().toUpperCase().trim(); // A, B, C, D

    // Points column removed in template, default to 10
    const points = 10;

    const options: { text: string; isCorrect: boolean }[] = [];

    // Helper to add option
    const addOpt = (text: any, letter: string) => {
      if (text !== undefined && text !== null && text !== "") {
        options.push({
          text: text.toString(),
          isCorrect: correctLetter === letter,
        });
      }
    };

    addOpt(optA, "A");
    addOpt(optB, "B");
    addOpt(optC, "C");
    addOpt(optD, "D");

    if (options.length > 0) {
      parsedQuestions.push({
        text: qText.toString(),
        points: points,
        options,
      });
    }
  });

  return parsedQuestions;
};

// --- GRADE EXPORT ---
export const generateGradeReport = (attempts: any[]): Buffer => {
  const headers = [
    "Student Name",
    "Email",
    "Score",
    "Status",
    "Attempts Count",
    "Best Attempt Date",
  ];

  const data = attempts.map((item) => [
    item.student.name,
    item.student.email,
    item.bestScore,
    item.status,
    item.attemptsCount,
    item.lastAttemptAt ? new Date(item.lastAttemptAt).toLocaleString() : "-",
  ]);

  const ws = xlsx.utils.aoa_to_sheet([headers, ...data]);

  ws["!cols"] = [
    { wch: 30 }, // Name
    { wch: 35 }, // Email
    { wch: 10 }, // Score
    { wch: 15 }, // Status
    { wch: 15 }, // Attempts
    { wch: 25 }, // Date
  ];

  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Grades");

  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};
