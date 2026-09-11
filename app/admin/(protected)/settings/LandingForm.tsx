// app/admin/(protected)/settings/LandingForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
import type { SiteSettings } from "@/types/domain";
import { updateLandingContent } from "./actions";

const landingSchema = z.object({
  hero_headline: z.string().trim().max(300).optional(),
  hero_body: z.string().trim().max(2000).optional(),
});

type LandingFormValues = z.infer<typeof landingSchema>;

export default function LandingForm({ settings }: { settings: SiteSettings | null }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LandingFormValues>({
    resolver: zodResolver(landingSchema),
    defaultValues: {
      hero_headline: settings?.hero_headline ?? "",
      hero_body: settings?.hero_body ?? "",
    },
  });

  function submit(values: LandingFormValues) {
    setServerError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateLandingContent({
          hero_headline: values.hero_headline ?? "",
          hero_body: values.hero_body ?? "",
        });
        setSaved(true);
      } catch (err) {
        setServerError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Hero content</p>
      <p className="text-xs text-ink-400 mb-5">
        Leave any field blank to fall back to the original site copy. CTA buttons are managed
        separately below.
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

        {serverError && (
          <p className="text-sm text-rust" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isPending ? "Saving…" : "Save"}
          </button>
          {saved && !isPending && <span className="text-xs text-forest">Saved.</span>}
        </div>
      </form>
    </div>
  );
}
