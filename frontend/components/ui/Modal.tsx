"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "danger" | "primary"; // Controls the color theme
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "primary",
}: ModalProps) {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = "hidden"; // Lock scroll
    } else {
      setTimeout(() => setShow(false), 200); // Allow fade-out animation
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!show) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center p-4 transition-opacity duration-200 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all"
        onClick={!isLoading ? onClose : undefined}
      ></div>

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-md bg-[#0b0724] border rounded-xl shadow-2xl p-6 transform transition-all duration-300 scale-100 ${
          isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        } ${
          isDanger
            ? "border-red-500/30 shadow-red-900/20"
            : "border-cyan-500/30 shadow-cyan-900/20"
        }`}
      >
        {/* Glow Effect */}
        <div
          className={`absolute -inset-1 rounded-xl opacity-20 blur-lg transition-all ${
            isDanger ? "bg-red-500" : "bg-cyan-500"
          }`}
        ></div>

        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3
              className={`text-xl font-bold uppercase tracking-tight flex items-center gap-2 ${
                isDanger ? "text-red-400" : "text-white"
              }`}
            >
              {isDanger && <AlertTriangle size={24} />}
              {title}
            </h3>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <p className="text-slate-300 leading-relaxed mb-8">{description}</p>

          {/* Footer / Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-wide shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isDanger
                  ? "bg-red-600 hover:bg-red-500 text-white shadow-red-900/30 hover:shadow-red-900/50"
                  : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-900/30 hover:shadow-cyan-900/50"
              }`}
            >
              {isLoading && (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              )}
              {isLoading ? "Processing..." : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
