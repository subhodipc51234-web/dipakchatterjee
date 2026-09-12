// app/admin/(protected)/settings/LandingForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/types/domain";
import { updateLandingContent } from "./actions";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

const landingSchema = z.object({
  hero_headline: z.string().trim().max(300).optional(),
  hero_body: z.string().trim().max(2000).optional(),
  hero_badge_subtitle: z.string().trim().max(100).optional(),
  hero_badge_title: z.string().trim().max(100).optional(),
});

type LandingFormValues = z.infer<typeof landingSchema>;

export default function LandingForm({ settings }: { settings: SiteSettings | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LandingFormValues>({
    resolver: zodResolver(landingSchema),
    defaultValues: {
      hero_headline: settings?.hero_headline ?? "",
      hero_body: settings?.hero_body ?? "",
      hero_badge_subtitle: settings?.hero_badge_subtitle ?? "",
      hero_badge_title: settings?.hero_badge_title ?? "",
    },
  });

  useUnsavedChangesWarning(isDirty);

  function submit(values: LandingFormValues) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateLandingContent({
          hero_headline: values.hero_headline ?? "",
          hero_body: values.hero_body ?? "",
          hero_badge_subtitle: values.hero_badge_subtitle ?? "",
          hero_badge_title: values.hero_badge_title ?? "",
        });
        setSaved(true);
        reset(values);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Hero content</p>
      <p className="text-xs text-ink-400 mb-5">
        Leave the headline or body blank to fall back to the original site copy; leave both badge
        fields blank to hide the photo badge entirely. CTA buttons are managed separately below.
      </p>

      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <label htmlFor="hero_headline" className="block text-sm font-medium text-navy-900 mb-1.5">
            Main headline
          </label>
          <textarea
            id="hero_headline"
            rows={2}
            {...register("hero_headline")}
            placeholder="Add title..."
            className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
          />
          {errors.hero_headline && (
            <p className="text-xs text-rust mt-1.5">{errors.hero_headline.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="hero_body" className="block text-sm font-medium text-navy-900 mb-1.5">
            Body copy
          </label>
          <textarea
            id="hero_body"
            rows={4}
            {...register("hero_body")}
            placeholder="Add description..."
            className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none resize-y"
          />
          {errors.hero_body && <p className="text-xs text-rust mt-1.5">{errors.hero_body.message}</p>}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="hero_badge_subtitle" className="block text-sm font-medium text-navy-900 mb-1.5">
              Photo badge location
            </label>
            <input
              id="hero_badge_subtitle"
              {...register("hero_badge_subtitle")}
              placeholder="e.g. Chanchal, North Malda"
              className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
            />
            {errors.hero_badge_subtitle && (
              <p className="text-xs text-rust mt-1.5">{errors.hero_badge_subtitle.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="hero_badge_title" className="block text-sm font-medium text-navy-900 mb-1.5">
              Photo badge role
            </label>
            <input
              id="hero_badge_title"
              {...register("hero_badge_title")}
              placeholder="e.g. Community Leader"
              className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
            />
            {errors.hero_badge_title && (
              <p className="text-xs text-rust mt-1.5">{errors.hero_badge_title.message}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-ink-400 -mt-3">
          Shown on the small floating card over the corner of the hero photo (desktop only).
          Leave both blank to hide the badge entirely — no placeholder text is shown.
        </p>

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
          {saved && !isPending && !isDirty && <span className="text-xs text-forest">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
