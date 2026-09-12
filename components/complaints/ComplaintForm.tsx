// components/complaints/ComplaintForm.tsx
//
// Exactly three fields: Description, Phone Number, and an optional
// Media Upload. Files are staged locally with instant preview
// thumbnails and only uploaded, bundled with the rest of the form, on
// submit — the actual upload happens server-side with the service-role
// key (see app/(site)/complaints/actions.ts).

"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, FileVideo, Loader2, Send, X } from "lucide-react";
import DropzoneUpload from "@/components/admin/DropzoneUpload";
import { submitComplaint } from "@/app/(site)/complaints/actions";
import { formatReferenceNumber } from "@/lib/reference";

const MAX_FILES = 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const formSchema = z.object({
  description: z.string().trim().min(20, "Please describe the issue in at least 20 characters.").max(5000),
  contact_phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || v.length >= 6, "Please enter a valid phone number, or leave this blank."),
});

type FormValues = z.infer<typeof formSchema>;

type StagedFile = { id: string; file: File; previewUrl: string };

export default function ComplaintForm() {
  const [files, setFiles] = useState<StagedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ referenceId: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "", contact_phone: "" },
  });

  function handleFiles(newFiles: File[]) {
    setFileError(null);

    const room = MAX_FILES - files.length;
    if (room <= 0) {
      setFileError(`You can attach up to ${MAX_FILES} files.`);
      return;
    }

    const accepted: StagedFile[] = [];
    for (const file of newFiles.slice(0, room)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      if (!isImage && !isVideo) {
        setFileError("Only image and video files are supported.");
        continue;
      }
      const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
      if (file.size > maxBytes) {
        setFileError(`"${file.name}" is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).`);
        continue;
      }
      accepted.push({ id: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file) });
    }

    setFiles((prev) => [...prev, ...accepted]);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }

  function submit(values: FormValues) {
    setServerError(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("description", values.description);
      formData.set("contact_phone", values.contact_phone);
      files.forEach((f) => formData.append("files", f.file));

      const res = await submitComplaint(formData);

      if (!res.success) {
        setServerError(res.error);
        return;
      }

      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
      setFiles([]);
      setResult({ referenceId: res.referenceId });
      reset();
    });
  }

  if (result) {
    return (
      <div className="text-center py-10">
        <div className="w-14 h-14 rounded-full bg-forest-100 text-forest flex items-center justify-center mx-auto mb-5">
          <Check className="w-7 h-7" />
        </div>
        <h3 className="font-display text-xl text-navy-900 mb-2">Your complaint has been logged</h3>
        <p className="text-sm text-ink-600 max-w-sm mx-auto mb-1">
          Reference number
        </p>
        <p className="font-display text-2xl text-navy-900 tracking-wide">
          {formatReferenceNumber(result.referenceId)}
        </p>
        <p className="text-sm text-ink-600 max-w-sm mx-auto mt-3">
          Please keep this number for any follow-up.
        </p>
        <button
          type="button"
          onClick={() => setResult(null)}
          className="mt-6 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80"
        >
          Submit another complaint
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-navy-900 mb-1.5">
          Description <span className="text-rust">*</span>
        </label>
        <textarea
          id="description"
          rows={6}
          {...register("description")}
          placeholder="Describe the issue: what happened, when, where, and who else is affected."
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-400 focus:border-[var(--theme-primary)] focus:outline-none resize-y"
        />
        {errors.description && (
          <p className="text-xs text-rust mt-1.5">{errors.description.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact_phone" className="block text-sm font-medium text-navy-900 mb-1.5">
          Phone Number <span className="text-ink-400 font-normal">(optional)</span>
        </label>
        <input
          id="contact_phone"
          type="tel"
          {...register("contact_phone")}
          placeholder="10-digit mobile number"
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink placeholder:text-ink-400 focus:border-[var(--theme-primary)] focus:outline-none"
        />
        {errors.contact_phone && (
          <p className="text-xs text-rust mt-1.5">{errors.contact_phone.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy-900 mb-1.5">
          Media Upload{" "}
          <span className="text-ink-400 font-normal">
            (optional, up to {MAX_FILES} photos/videos &mdash; max {MAX_IMAGE_BYTES / 1024 / 1024}MB per photo,{" "}
            {MAX_VIDEO_BYTES / 1024 / 1024}MB per video)
          </span>
        </label>

        <DropzoneUpload
          accept="image/*,video/*"
          multiple
          disabled={files.length >= MAX_FILES}
          label="Drag & drop photos or video here, or click to browse"
          onFiles={handleFiles}
        />

        {fileError && <p className="text-xs text-rust mt-2">{fileError}</p>}

        {files.length > 0 && (
          <ul className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
            {files.map((f) => (
              <li key={f.id} className="relative aspect-square rounded-md overflow-hidden border border-line bg-paper-100">
                {f.file.type.startsWith("video/") ? (
                  <div className="relative w-full h-full">
                    <video
                      src={f.previewUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-navy-900/20">
                      <FileVideo className="w-5 h-5 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.previewUrl} alt="" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  aria-label="Remove file"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-navy-900/80 text-white flex items-center justify-center touch-manipulation"
                >
                  <X className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {serverError && (
        <p className="text-sm text-rust" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-hover)] disabled:opacity-60 text-white font-semibold py-3.5 rounded-md transition-colors flex items-center justify-center gap-2"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {isPending ? "Submitting…" : "Submit Complaint"}
      </button>

      <p className="text-xs text-ink-400 text-center leading-relaxed">
        By submitting, you agree that your details are shared with our office for the sole
        purpose of resolving this issue.
      </p>
    </form>
  );
}
