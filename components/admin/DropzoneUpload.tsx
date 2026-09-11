// components/admin/DropzoneUpload.tsx
//
// Pure drag-and-drop / click-to-select surface. It only ever hands files
// back to its caller — the caller owns preview thumbnails, upload calls,
// and progress state, since those differ between a single hero image and
// a multi-item media gallery.

"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";

export default function DropzoneUpload({
  accept,
  multiple = false,
  disabled = false,
  label = "Drag & drop a file here, or click to browse",
  onFiles,
}: {
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  onFiles: (files: File[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    onFiles(Array.from(fileList));
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-colors ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      } ${isDragOver ? "border-saffron bg-saffron-100/40" : "border-line bg-paper-100 hover:border-saffron/60"}`}
    >
      <UploadCloud className={`w-6 h-6 ${isDragOver ? "text-saffron-600" : "text-ink-400"}`} />
      <p className="text-sm text-ink-600">{label}</p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
