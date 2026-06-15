import { useState } from "react";
import { Upload, FileSpreadsheet, KeyRound } from "lucide-react";
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

  const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setBulkData(data);
      toast.success(`Parsed ${data.length} rows`);
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
            Upload an Excel file (.xlsx) containing user data.
          </p>
          <p className="text-slate-500 text-xs mt-1">
            Columns required: Name, Email, Role (student/teacher), Majority,
            StudyProgram, NIM (optional), NIP (optional)
          </p>
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
