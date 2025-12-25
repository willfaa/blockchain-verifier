// frontend/components/RichTextEditor.tsx
"use client";

// Dynamic import karena react-quill butuh window (CSR Only)
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import React, { useMemo } from "react";

const ReactQuill = dynamic(
  async () => {
    const mod = await import("react-quill-new");
    const RQ = mod.default;
    // Handle Quill export (depends on build) - cast to any to avoid TS error
    const Quill = (mod as any).Quill || (RQ as any).Quill;

    // Dynamically load image resize module on client side
    // @ts-ignore
    const { default: ImageResize } = await import(
      "quill-image-resize-module-react"
    );
    if (Quill) {
      Quill.register("modules/imageResize", ImageResize);
    }
    return RQ;
  },
  { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function RichTextEditor({
  value,
  onChange,
  readOnly = false,
}: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: readOnly
        ? false
        : [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ color: [] }, { background: [] }], // Color Picker
            [
              { list: "ordered" },
              { list: "bullet" },
              { indent: "-1" },
              { indent: "+1" },
            ],
            ["link", "image", "code-block"],
            ["clean"],
          ],
      clipboard: {
        matchVisual: false,
      },
      // Enable Image Resize Module
      imageResize: {
        parchment: {
          image: { attribute: ["style"], style: ["width", "height"] },
        }, // attempt to use style
        // style: true, // Use style attribute instead of width/height attributes if supported
        modules: ["Resize", "DisplaySize"],
      },
    }),
    [readOnly]
  );

  return (
    <div className={`rich-text-container ${readOnly ? "read-only-mode" : ""}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        modules={modules}
        className="bg-[#0d0b2f]/50 text-white rounded-xl border border-white/10"
      />
      {/* Styles for overriding Quill default light theme */}
      <style jsx global>{`
        .ql-toolbar {
          border-color: rgba(255, 255, 255, 0.1) !important;
          background: rgba(13, 11, 47, 0.8);
          border-top-left-radius: 0.75rem;
          border-top-right-radius: 0.75rem;
        }
        .ql-container {
          border-color: rgba(255, 255, 255, 0.1) !important;
          background: rgba(13, 11, 47, 0.5);
          border-bottom-left-radius: 0.75rem;
          border-bottom-right-radius: 0.75rem;
          color: #cbd5e1;
          font-family: inherit;
          min-height: 300px;
        }
        .ql-stroke {
          stroke: #94a3b8 !important;
          width: 0.5px;
        }
        .ql-fill {
          fill: #94a3b8 !important;
        }
        .ql-picker {
          color: #94a3b8 !important;
        }
        /* Code Block Styling */
        .ql-snow .ql-editor pre.ql-syntax,
        .ql-snow .ql-editor pre {
          background-color: #1e1e1e !important;
          color: #d4d4d4 !important;
          font-family: "JetBrains Mono", "Fira Code", monospace !important;
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Hide Toolbar in Student Mode */
        .read-only-mode .ql-toolbar {
          display: none;
        }
        .read-only-mode .ql-container {
          border: none !important;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
