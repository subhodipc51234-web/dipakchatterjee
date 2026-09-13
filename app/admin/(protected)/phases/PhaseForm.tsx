// app/admin/(protected)/phases/PhaseForm.tsx
//
// `summary` is the short homepage blurb; `full_content` is the detailed
// narrative shown only on this phase's dedicated "Read More" page
// (app/(site)/phases/[id]/page.tsx) — same short/long split as
// posts.body vs. a post's full page, now restored for phases. Photos
// are a separate concern, handled by PhasePhotosManager on the same
// edit page.
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
  summary: z.string().trim().min(1, "Summary is required").max(2000),
  full_content: z.string().trim().max(20000).optional(),
  slideshow_interval: z.number().min(0).max(10),
  max_display_images: z.number().int().min(1).max(20),
  is_published: z.boolean(),
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
      full_content: phase?.full_content ?? "",
      slideshow_interval: phase?.slideshow_interval ?? 0,
      max_display_images: phase?.max_display_images ?? 4,
      is_published: phase?.is_published ?? false,
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
          full_content: values.full_content ?? "",
          slideshow_interval: values.slideshow_interval,
          max_display_images: values.max_display_images,
          is_published: values.is_published,
        });
        reset(values);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
      {phase && (
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Section type</label>
          <select
            disabled
            value="phases"
            className="w-full rounded-md border border-line bg-paper-100 px-4 py-3 text-sm text-ink-400 cursor-not-allowed"
          >
            <option value="phases">Phases</option>
          </select>
          <p className="text-xs text-ink-400 mt-1.5">A section&rsquo;s type is set when it&rsquo;s created and can&rsquo;t be changed.</p>
        </div>
      )}

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
          Summary
        </label>
        <textarea
          id="summary"
          rows={4}
          {...register("summary")}
          placeholder="A short blurb shown on the homepage, under the title/period."
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
        {errors.summary && <p className="text-xs text-rust mt-1.5">{errors.summary.message}</p>}
      </div>

      <div>
        <label htmlFor="full_content" className="block text-sm font-medium text-navy-900 mb-1.5">
          Full Story / Detailed Description
        </label>
        <textarea
          id="full_content"
          rows={10}
          {...register("full_content")}
          placeholder="The complete narrative, shown on this phase's own 'Read More' page. Supports Markdown."
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          Optional — leave blank to show just the Summary on the Read More page too.
        </p>
        {errors.full_content && <p className="text-xs text-rust mt-1.5">{errors.full_content.message}</p>}
      </div>

      <div>
        <label htmlFor="slideshow_interval" className="block text-sm font-medium text-navy-900 mb-1.5">
          Slideshow interval (seconds)
        </label>
        <input
          id="slideshow_interval"
          type="number"
          min={0}
          max={10}
          step={0.1}
          {...register("slideshow_interval", { valueAsNumber: true })}
          className="w-32 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          Supports decimals (e.g. <strong>2.5</strong>). When set above 0, the homepage
          automatically slideshows this phase&rsquo;s photos instead of showing them as a grid.
          Set to <strong>0</strong> to disable the slideshow and show a grid instead.
        </p>
        {errors.slideshow_interval && (
          <p className="text-xs text-rust mt-1.5">{errors.slideshow_interval.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="max_display_images" className="block text-sm font-medium text-navy-900 mb-1.5">
          Homepage Max Display Images
        </label>
        <input
          id="max_display_images"
          type="number"
          min={1}
          max={20}
          step={1}
          {...register("max_display_images", { valueAsNumber: true })}
          className="w-32 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <p className="text-xs text-ink-400 mt-1.5">
          How many photos show in the homepage grid when the slideshow is off. The full gallery
          always shows on this phase&rsquo;s Read More page.
        </p>
        {errors.max_display_images && (
          <p className="text-xs text-rust mt-1.5">{errors.max_display_images.message}</p>
        )}
      </div>

      <label className="flex items-center gap-2.5 text-sm text-navy-900 font-medium">
        <input
          type="checkbox"
          {...register("is_published")}
          className="w-4 h-4 rounded border-line text-saffron focus:ring-saffron"
        />
        Published (visible on the public site)
      </label>

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
