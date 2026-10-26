import { useState } from "react";
import { Upload, FileSpreadsheet, KeyRound, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import api from "@/lib/api";
import { toast } from "sonner";

interface BulkImportModuleProps {
  onSuccess: () => void;
}

export const BulkImportModule = ({ onSuccess }: BulkImportModuleProps) => {
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkData, setBulkData] = useState<any[]>([]);
  const [batchPassword, setBatchPassword] = useState("");
  const [importing, setImporting] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/admin/users/template", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Template_Import_Users.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Template Excel berhasil diunduh!");
    } catch (err: any) {
      console.error("[Download Template Error]:", err);
      let errorMsg = "Gagal mengunduh template Excel";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          if (parsed.error) errorMsg = parsed.error;
        } catch (_) {}
      } else if (err.response?.data?.error) {
        errorMsg = err.response.data.error;
      }
      toast.error(errorMsg);
    }

  };



  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        // Normalize header keys & ensure role is uppercase
        const normalizedData = rawData.map((row) => {
          const roleRaw = (row.role || row.Role || "STUDENT").toString().trim().toUpperCase();
          const role = roleRaw.includes("TEACH") || roleRaw.includes("GURU") ? "TEACHER" : "STUDENT";
          return {
            name: (row.name || row.Name || row.nama || row.Nama || "").toString().trim(),
            email: (row.email || row.Email || "").toString().trim(),
            role,
            faculty: (row["Bidang Keahlian"] || row.bidangKeahlian || row.faculty || row.Faculty || row.bidang || row.Bidang || "").toString().trim(),
            studyProgram: (row["Program Keahlian"] || row.programKeahlian || row.studyProgram || row.StudyProgram || row.program || row.Program || "").toString().trim(),
            majority: (row["Konsentrasi Keahlian"] || row.konsentrasiKeahlian || row.majority || row.Majority || row.konsentrasi || row.Konsentrasi || row.jurusan || row.Jurusan || "").toString().trim(),
            studentId: (row.studentId || row.StudentId || row.nim || row.NIM || row.nisn || row.NISN || "").toString().trim(),
            nip: (row.nip || row.NIP || "").toString().trim(),
          };
        });

        setBulkData(normalizedData);
        toast.success(`Berhasil membaca ${normalizedData.length} baris data user`);
      } catch (parseErr) {
        toast.error("Gagal memproses file Excel. Pastikan format file valid.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const executeBulkImport = () => {
    if (!bulkData.length) return toast.error("No data to import");
    if (!batchPassword) return toast.error("Please set a default password");

    setImporting(true);
    api
      .post("/admin/users/bulk", {
        users: bulkData,
        defaultPassword: batchPassword,
      })
      .then((res) => {
        toast.success(res.data.message);
        if (res.data.errors?.length > 0) {
          console.error(res.data.errors);
          toast.warning(
            `Failed to import ${res.data.errors.length} users. Check console.`
          );
        }
        // Cleanup
        setBulkFile(null);
        setBulkData([]);
        setBatchPassword("");
        onSuccess(); // Trigger parent refresh or redirect
      })
      .catch((err) => toast.error("Bulk import failed"))
      .finally(() => setImporting(false));
  };

  return (
    <div className="bg-[#050510] border border-teal-900/30 rounded-lg p-8 min-h-[400px]">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center">
          <div className="bg-teal-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-teal-500/30">
            <FileSpreadsheet className="text-teal-400 w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Bulk User Import
          </h2>
          <p className="text-slate-400 text-sm">
            Upload file Excel (.xlsx) data pengguna (Siswa & Guru).
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Kolom: Name, Email, Role (STUDENT/TEACHER), Bidang Keahlian, Program Keahlian, Konsentrasi Keahlian, StudentId/NISN, NIP
          </p>


          {/* Download Template Button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-teal-500/10 cursor-pointer"
            >
              <FileDown size={15} />
              Unduh Template Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-teal-400 uppercase tracking-widest flex items-center gap-2">
            <KeyRound size={14} /> Default Password for Batch
          </label>
          <input
            type="text"
            value={batchPassword}
            onChange={(e) => setBatchPassword(e.target.value)}
            placeholder="e.g. RPL-2025-Secure"
            className="w-full bg-slate-900/50 border border-teal-500/30 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-teal-400 transition-all font-mono"
          />
          <p className="text-[10px] text-slate-500">
            All imported users will have this password initially.
          </p>
        </div>

        {/* File Upload */}
        <div className="relative border-2 border-dashed border-teal-900/50 rounded-xl p-8 hover:bg-teal-900/10 transition-all group cursor-pointer">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileDrop}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-teal-400 transition-colors">
            <Upload size={32} className="mb-3" />
            <span className="font-bold text-sm">Click to Upload Excel</span>
            <span className="text-xs mt-1 opacity-70">
              {bulkFile ? bulkFile.name : "or drag and drop here"}
            </span>
          </div>
        </div>

        {/* Action Button */}
        {bulkData.length > 0 && (
          <div className="bg-teal-900/20 border border-teal-500/30 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-teal-200 text-sm font-bold">
                Ready to import {bulkData.length} users?
              </span>
              <button
                onClick={() => setBulkData([])}
                className="text-red-400 text-xs hover:underline"
              >
                Clear
              </button>
            </div>
            <button
              onClick={executeBulkImport}
              disabled={importing || !batchPassword}
              className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? "Importing..." : "Confirm Import"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
