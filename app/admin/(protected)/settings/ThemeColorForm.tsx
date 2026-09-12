// app/admin/(protected)/settings/ThemeColorForm.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateThemeColors } from "./actions";
import { useUnsavedChangesWarning } from "@/lib/useUnsavedChangesWarning";

export default function ThemeColorForm({
  primaryColor,
  secondaryColor,
}: {
  primaryColor: string;
  secondaryColor: string;
}) {
  const [primary, setPrimary] = useState(primaryColor);
  const [secondary, setSecondary] = useState(secondaryColor);
  // The last-saved values, not the initial props — used to compute
  // isDirty so the guard clears the moment a save succeeds instead of
  // waiting on the parent Server Component to re-fetch and hand back
  // new props.
  const [baseline, setBaseline] = useState({ primary: primaryColor, secondary: secondaryColor });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isDirty = primary !== baseline.primary || secondary !== baseline.secondary;
  useUnsavedChangesWarning(isDirty);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateThemeColors({ theme_primary_color: primary, theme_secondary_color: secondary });
        setSaved(true);
        setBaseline({ primary, secondary });
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
