// app/admin/(protected)/settings/ThemeColorForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateThemeColors } from "./actions";

export default function ThemeColorForm({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateThemeColors({ theme_primary_color: primary, theme_secondary_color: secondary });
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Color &amp; theme</p>
      <p className="text-xs text-ink-400 mb-5">
        Applied across the public site (buttons, links, dark sections) via CSS variables.
        CTA buttons use Main Theme Color unless given their own override below.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="theme_primary" className="block text-sm font-medium text-navy-900 mb-1.5">
              Main Theme Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="theme_primary"
                type="color"
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="w-12 h-11 rounded-md border border-line cursor-pointer"
              />
              <input
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label htmlFor="theme_secondary" className="block text-sm font-medium text-navy-900 mb-1.5">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="theme_secondary"
                type="color"
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="w-12 h-11 rounded-md border border-line cursor-pointer"
              />
              <input
                value={secondary}
                onChange={(e) => setSecondary(e.target.value)}
                className="flex-1 rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-rust" role="alert">
            {error}
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
