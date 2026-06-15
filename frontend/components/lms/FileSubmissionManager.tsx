"use client";

import { useState, useRef } from "react";
import {
  File,
  Plus,
  FolderPlus,
  Download,
  Trash2,
  LayoutGrid,
  List,
  FileText,
  Loader2,
  X,
  FileArchive,
  Image as ImageIcon,
  Folder,
  FileSpreadsheet,
  FileCode,
  Presentation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { toast } from "sonner";

interface FileEntry {
  name: string;
  url: string;
  size: number;
  type: string;
  createdAt: string;
  path?: string; // Relative path for hierarchical view
  cid?: string;
  fileHash?: string;
}

interface FileSubmissionManagerProps {
  files: FileEntry[];
  onFilesChange: (files: FileEntry[]) => void;
  assignmentId: string;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

export const getFileIcon = (type: string, size = 16) => {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("image"))
    return <ImageIcon size={size} className="text-pink-500" />;
  if (
    lowerType.includes("zip") ||
    lowerType.includes("rar") ||
    lowerType.includes("archive") ||
    lowerType.includes("compressed")
  )
    return <FileArchive size={size} className="text-amber-500" />;
  if (lowerType.includes("pdf"))
    return <FileText size={size} className="text-red-500" />;
  if (
    lowerType.includes("word") ||
    lowerType.includes("officedocument.wordprocessingml")
  )
    return <FileText size={size} className="text-blue-500" />;
  if (
    lowerType.includes("excel") ||
    lowerType.includes("officedocument.spreadsheetml") ||
    lowerType.includes("sheet")
  )
    return <FileSpreadsheet size={size} className="text-green-500" />;
  if (
    lowerType.includes("presentation") ||
    lowerType.includes("powerpoint") ||
    lowerType.includes("officedocument.presentationml")
  )
    return <Presentation size={size} className="text-orange-500" />;
  if (
    lowerType.includes("javascript") ||
    lowerType.includes("typescript") ||
    lowerType.includes("python") ||
    lowerType.includes("html") ||
    lowerType.includes("css") ||
    lowerType.includes("json") ||
    lowerType.includes("code")
  )
    return <FileCode size={size} className="text-purple-400" />;

  return <FileText size={size} className="text-neon-blue" />;
};

export function FileSubmissionManager({
  files,
  onFilesChange,
  assignmentId,
  maxFiles = 20,
  maxSizeMB = 10,
  disabled = false,
}: FileSubmissionManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const uploadFile = async (
    file: File,
    relativePath?: string,
    fileHash?: string
  ) => {
    const formData = new FormData();
    formData.append("assignment_file", file);
    formData.append("assignmentId", assignmentId);
    if (fileHash) {
      formData.append("fileHash", fileHash);
    }

    const res = await api.post("/lms/assignments/upload-artifact", formData);
    const metadata: FileEntry = res.data.data;
    if (relativePath) {
      metadata.path = relativePath;
    }
    if (fileHash) {
      metadata.fileHash = fileHash;
    }
    return metadata;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesToUpload = Array.from(e.target.files || []);
    if (filesToUpload.length === 0) return;

    if (files.length + filesToUpload.length > maxFiles) {
      toast.error(`Maximum file limit of ${maxFiles} reached.`);
      return;
    }

    try {
      setUploading(true);
      const results: FileEntry[] = [];
      for (const file of filesToUpload) {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds ${maxSizeMB}MB limit.`);
          continue;
        }
        const fileHash = await calculateFileHash(file);
        const meta = await uploadFile(file, undefined, fileHash);
        results.push(meta);
      }

      onFilesChange([...files, ...results]);
      toast.success(`${results.length} files added to workspace`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesToUpload = Array.from(e.target.files || []);
    if (filesToUpload.length === 0) return;

    if (files.length + filesToUpload.length > maxFiles) {
      toast.error(`Maximum file limit of ${maxFiles} reached.`);
      return;
    }

    try {
      setUploading(true);
      const results: FileEntry[] = [];
      for (const file of filesToUpload) {
        // webkitRelativePath contains the folder structure
        const path = (file as any).webkitRelativePath;
        const fileHash = await calculateFileHash(file);
        const meta = await uploadFile(file, path, fileHash);
        results.push(meta);
      }

      onFilesChange([...files, ...results]);
      toast.success(`Folder uploaded with ${results.length} files`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Folder upload failed");
    } finally {
      setUploading(false);
      if (folderInputRef.current) folderInputRef.current.value = "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = Array.from(e.dataTransfer.items);
    if (items.length === 0) return;

    try {
      setUploading(true);
      const results: FileEntry[] = [];

      const processEntry = async (
        entry: FileSystemEntry,
        currentPath = ""
      ): Promise<void> => {
        if (entry.isFile) {
          const file = await new Promise<File>((resolve) =>
            (entry as FileSystemFileEntry).file(resolve)
          );
          const fileHash = await calculateFileHash(file);
          const meta = await uploadFile(
            file,
            currentPath ? `${currentPath}/${file.name}` : file.name,
            fileHash
          );
          results.push(meta);
        } else if (entry.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader();
          const entries = await new Promise<FileSystemEntry[]>((resolve) =>
            dirReader.readEntries(resolve)
          );
          for (const subEntry of entries) {
            await processEntry(
              subEntry,
              currentPath ? `${currentPath}/${entry.name}` : entry.name
            );
          }
        }
      };

      for (const item of items) {
        const entry = item.webkitGetAsEntry();
        if (entry) await processEntry(entry);
      }

      onFilesChange([...files, ...results]);
      toast.success(`Dropped items (${results.length} files) added`);
    } catch (err) {
      toast.error("Drop failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSelected = () => {
    const newFiles = files.filter((f) => !selectedUrls.includes(f.url));
    onFilesChange(newFiles);
    setSelectedUrls([]);
    toast.success("Removed from workspace");
  };

  const toggleSelect = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUrls.length === files.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(files.map((f) => f.url));
    }
  };

  return (
    <div className="space-y-4">
      {/* Constraints Header */}
      <div className="flex justify-between items-end mb-2">
        <h3 className="text-white font-bold text-sm tracking-tight">
          Assignment Workspace
        </h3>
        <p className="text-[10px] text-slate-500 font-medium">
          Maximum file size: {maxSizeMB} MB, maximum number of files: {maxFiles}
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-t-xl p-2">
        <div className="flex items-center gap-1.5">
          <input
            type="file"
            className="hidden"
            ref={folderInputRef}
            onChange={handleFolderUpload}
            disabled={disabled || uploading}
            {...({ webkitdirectory: "", directory: "" } as any)}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-8 w-10 bg-white/10 text-white hover:bg-white/20 rounded-md"
            title="Add File"
            disabled={disabled || uploading}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => folderInputRef.current?.click()}
            className="h-8 w-10 bg-white/10 text-white hover:bg-white/20 rounded-md"
            title="Upload Folder"
            disabled={disabled || uploading}
          >
            <FolderPlus size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-10 bg-white/10 text-white hover:bg-white/20 rounded-md"
            title="Download Selected"
            disabled={selectedUrls.length === 0}
            onClick={() =>
              selectedUrls.forEach((url) => window.open(url, "_blank"))
            }
          >
            <Download size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-10 bg-white/10 text-white hover:bg-red-500/20 hover:text-red-400 rounded-md"
            title="Delete Selected"
            disabled={disabled || selectedUrls.length === 0}
            onClick={handleDeleteSelected}
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("grid")}
            className={cn(
              "h-7 w-7 rounded-md transition-all",
              viewMode === "grid"
                ? "bg-purple-500/20 text-purple-400 shadow-lg border border-purple-500/30"
                : "bg-white/5 text-slate-400"
            )}
          >
            <LayoutGrid size={14} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode("list")}
            className={cn(
              "h-7 w-7 rounded-md transition-all",
              viewMode === "list"
                ? "bg-purple-500/20 text-purple-400 shadow-lg border border-purple-500/30"
                : "bg-white/5 text-slate-400"
            )}
          >
            <List size={14} />
          </Button>
        </div>
      </div>

      {/* File List Area */}
      <div
        className={cn(
          "bg-[#0f172a] border-x border-b border-white/5 rounded-b-xl overflow-hidden min-h-[160px] relative transition-all",
          dragActive && "bg-purple-500/10 border-purple-500/50"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {dragActive && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="bg-purple-500/20 border-2 border-dashed border-purple-500 rounded-3xl p-10 backdrop-blur-md animate-pulse">
              <Plus size={48} className="text-purple-400 mx-auto mb-4" />
              <p className="text-purple-400 font-bold uppercase tracking-widest text-xs">
                Drop items to upload
              </p>
            </div>
          </div>
        )}

        {viewMode === "list" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] uppercase font-bold text-slate-500 tracking-wider text-center">
                <th className="py-2 pl-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      selectedUrls.length > 0 &&
                      selectedUrls.length === files.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-white/20 bg-transparent text-purple-500 focus:ring-purple-500"
                  />
                </th>
                <th className="py-2 px-4 font-bold text-left">Name</th>
                <th className="py-2 px-4">Last modified</th>
                <th className="py-2 px-4">Size</th>
                <th className="py-2 px-4">Type</th>
              </tr>
            </thead>
            <tbody className="text-[11px] text-slate-300">
              {files.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center italic text-slate-600 font-medium"
                  >
                    Workspace is empty. Add files above.
                  </td>
                </tr>
              ) : (
                files.map((file, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      "border-t border-white/5 hover:bg-white/[0.02] transition-colors group",
                      selectedUrls.includes(file.url) && "bg-purple-500/5"
                    )}
                  >
                    <td className="py-3 pl-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUrls.includes(file.url)}
                        onChange={() => toggleSelect(file.url)}
                        className="w-4 h-4 rounded border-white/10 group-hover:border-white/30 bg-transparent text-purple-500 focus:ring-purple-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getFileIcon(file.type)}
                        <div className="flex flex-col min-w-0">
                          <a
                            href={file.url}
                            target="_blank"
                            className="hover:text-neon-blue hover:underline transition-all truncate max-w-[200px] font-bold"
                          >
                            {file.name}
                          </a>
                          {file.fileHash && (
                            <p className="text-[8px] text-cyan-400 font-mono tracking-tighter truncate max-w-[180px]">
                              Fingerprint: {file.fileHash}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-center">
                      {new Date(file.createdAt).toLocaleString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-center">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[9px] text-center">
                      {file.type || "unknown"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {viewMode === "grid" && (
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.length === 0 ? (
              <p className="col-span-full py-10 text-center italic text-slate-600 font-medium">
                Workspace is empty.
              </p>
            ) : (
              files.map((file, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-xl border border-white/5 transition-all group relative",
                    selectedUrls.includes(file.url)
                      ? "bg-purple-500/10 border-purple-500/30"
                      : "hover:bg-white/5"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedUrls.includes(file.url)}
                    onChange={() => toggleSelect(file.url)}
                    className="absolute top-2 right-2 w-3 h-3 rounded border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="mb-3 text-neon-blue group-hover:scale-110 transition-transform">
                    {getFileIcon(file.type, 48)}
                  </div>
                  <a
                    href={file.url}
                    target="_blank"
                    className="text-[10px] font-bold text-center text-white/80 hover:text-white truncate w-full"
                  >
                    {file.name}
                  </a>
                  {file.fileHash && (
                    <p className="text-[7px] text-cyan-400 font-mono tracking-tighter truncate w-full mt-1">
                      FP: {file.fileHash}
                    </p>
                  )}
                  <p className="text-[8px] text-slate-500 mt-1 uppercase tracking-tight">
                    {formatFileSize(file.size)}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer / Accepted Types */}
      <div className="pt-2 text-[10px] space-y-1">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
          Accepted file types:
        </p>
        <p className="text-slate-400">All academic file formats supported.</p>
      </div>
    </div>
  );
}
