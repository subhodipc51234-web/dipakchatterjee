// app/admin/(protected)/features/FeatureForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import { FEATURE_TYPE_LABELS, type Feature, type FeatureType } from "@/types/domain";
import type { FeatureFormInput } from "./actions";

const FEATURE_TYPES = Object.keys(FEATURE_TYPE_LABELS) as FeatureType[];

const featureSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  subtitle: z.string().trim().max(300).optional(),
  type: z.enum(FEATURE_TYPES as [FeatureType, ...FeatureType[]]),
  body_markdown: z.string().max(20000).optional(),
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
    formState: { errors },
  } = useForm<FeatureFormValues>({
    resolver: zodResolver(featureSchema),
    defaultValues: {
      title: feature?.title ?? "",
      subtitle: feature?.subtitle ?? "",
      type: feature?.type ?? "custom_section",
      body_markdown: feature?.body_markdown ?? "",
      is_published: feature?.is_published ?? false,
    },
  });

  function submit(values: FeatureFormValues) {
    setServerError(null);
    startTransition(async () => {
      try {
        await onSubmit({
          title: values.title,
          subtitle: values.subtitle ?? "",
          body_markdown: values.body_markdown ?? "",
          type: values.type,
          is_published: values.is_published,
        });
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5">
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
        <label htmlFor="type" className="block text-sm font-medium text-navy-900 mb-1.5">
          Section type
        </label>
        <select
          id="type"
          {...register("type")}
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
        >
          {FEATURE_TYPES.map((t) => (
            <option key={t} value={t}>
              {FEATURE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="body_markdown" className="block text-sm font-medium text-navy-900 mb-1.5">
          Body (Markdown)
        </label>
        <textarea
          id="body_markdown"
          rows={8}
          {...register("body_markdown")}
          placeholder={
            "Supports Markdown. For a Stats Strip, try a list like:\n- **20+** Years in Education\n- **15+** Years of Public Outreach"
          }
          className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
        />
        {errors.body_markdown && (
          <p className="text-xs text-rust mt-1.5">{errors.body_markdown.message}</p>
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

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {isPending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
