// app/admin/(protected)/phases/PhaseForm.tsx
//
// Streamlined to exactly the fields the schema now has: title, period,
// and summary (which doubles as the full narrative — there is no
// separate "short blurb" vs "full story" split anymore). Photos are a
// separate concern, handled by PhasePhotosManager on the same edit page.
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { Phase } from "@/types/domain";
import type { PhaseFormInput } from "./actions";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

const phaseSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  period: z.string().trim().max(100).optional(),
  summary: z.string().trim().min(1, "Summary / story is required").max(20000),
});

type PhaseFormValues = z.infer<typeof phaseSchema>;

export default function PhaseForm({
  phase,
  onSubmit,
}: {
  phase?: Phase;
  onSubmit: (input: PhaseFormInput) => Promise<void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PhaseFormValues>({
    resolver: zodResolver(phaseSchema),
    defaultValues: {
      title: phase?.title ?? "",
      period: phase?.period ?? "",
      summary: phase?.summary ?? "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  function submit(values: PhaseFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          title: values.title,
          period: values.period ?? "",
          summary: values.summary,
        });
        reset(values);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-navy-900 mb-1.5">
          Phase Title
        </label>
        <input
          id="title"
          {...register("title")}
          placeholder="e.g. Teaching Career"
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        {errors.title && <p className="text-xs text-rust mt-1.5">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="period" className="block text-sm font-medium text-navy-900 mb-1.5">
          Period
        </label>
        <input
          id="period"
          {...register("period")}
          placeholder="e.g. 2000 - 2012"
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        {errors.period && <p className="text-xs text-rust mt-1.5">{errors.period.message}</p>}
      </div>

      <div>
        <label htmlFor="summary" className="block text-sm font-medium text-navy-900 mb-1.5">
          Summary / Story
        </label>
        <textarea
          id="summary"
          rows={10}
          {...register("summary")}
          placeholder="The full narrative for this phase. Supports Markdown."
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
        {errors.summary && <p className="text-xs text-rust mt-1.5">{errors.summary.message}</p>}
      </div>

      {serverError && (
        <p className="text-sm text-rust" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className={`inline-flex items-center gap-2 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors ${
            isDirty
              ? "bg-rust hover:bg-rust/90 shadow-[0_0_0_3px_rgba(180,75,61,0.2)]"
              : "bg-saffron hover:bg-saffron-600"
          }`}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? "Saving…" : isDirty ? "Save Changes" : "Save"}
        </button>
        {isDirty && !isPending && (
          <span className="text-xs font-medium text-rust">You have unsaved changes.</span>
        )}
      </div>
    </form>
  );
}
