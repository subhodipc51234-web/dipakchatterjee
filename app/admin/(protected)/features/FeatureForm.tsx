// app/admin/(protected)/features/FeatureForm.tsx
//
// Fields for the "Image Gallery" Section Type only — the other type,
// "Phases", is a different entity/table entirely (see ../phases/*) with
// its own form. The type itself isn't editable here (a section's kind
// is fixed at creation — see ../new/NewSectionForm.tsx): when editing
// an existing feature this just shows a locked indicator for context.
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { Feature } from "@/types/domain";
import type { FeatureFormInput } from "./actions";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

const featureSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: z.string().trim().max(300).optional(),
  slideshow_interval: z.number().min(0).max(10),
  is_published: z.boolean(),
});

type FeatureFormValues = z.infer<typeof featureSchema>;

export default function FeatureForm({
  feature,
  onSubmit,
}: {
  feature?: Feature;
  onSubmit: (input: FeatureFormInput) => Promise<void>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: feature?.title ?? "",
      subtitle: feature?.subtitle ?? "",
      slideshow_interval: feature?.slideshow_interval ?? 5,
      is_published: feature?.is_published ?? false,
    },
  });

  useUnsavedChangesWarning(isDirty);

  function submit(values: FeatureFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          title: values.title,
          subtitle: values.subtitle ?? "",
          slideshow_interval: values.slideshow_interval,
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
      {feature && (
        <div>
          <label className="block text-sm font-medium text-navy-900 mb-1.5">Section type</label>
          <select
            disabled
            value="public_life_gallery"
            className="w-full rounded-md border border-line bg-paper-100 px-4 py-3 text-sm text-ink-400 cursor-not-allowed"
          >
            <option value="public_life_gallery">Image Gallery</option>
          </select>
          <p className="text-xs text-ink-400 mt-1.5">A section&rsquo;s type is set when it&rsquo;s created and can&rsquo;t be changed.</p>
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-navy-900 mb-1.5">
          Title
        </label>
        <input
          id="title"
          {...register("title")}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        {errors.title && (
          <p className="text-xs text-rust mt-1.5">{errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="subtitle" className="block text-sm font-medium text-navy-900 mb-1.5">
          Subtitle
        </label>
        <input
          id="subtitle"
          {...register("subtitle")}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        {errors.subtitle && (
          <p className="text-xs text-rust mt-1.5">{errors.subtitle.message}</p>
        )}
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
          How long each image shows before auto-advancing, when this gallery has multiple images
          (0-10 seconds, decimals like <strong>2.5</strong> allowed). Set to <strong>0</strong> to
          disable auto-advance entirely — visitors can still navigate manually with the
          arrows/dots.
        </p>
        {errors.slideshow_interval && (
          <p className="text-xs text-rust mt-1.5">{errors.slideshow_interval.message}</p>
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
