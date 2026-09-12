// app/admin/(protected)/features/GalleryIntervalControl.tsx
//
// Number input for the public hero/banner (Image Gallery) carousel's
// auto-advance speed, in seconds — site_settings.gallery_interval_ms
// stores milliseconds, this just converts at the boundary.

"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateGalleryIntervalSeconds } from "./actions";

/** Milliseconds -> seconds, rounded to one decimal place (e.g. 2500ms -> 2.5). */
function toSeconds(ms: number) {
  return Math.round((ms / 1000) * 10) / 10;
}

export default function GalleryIntervalControl({ intervalMs }: { intervalMs: number }) {
  const [seconds, setSeconds] = useState(toSeconds(intervalMs));
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    startTransition(async () => {
      try {
        await updateGalleryIntervalSeconds(seconds);
        setSaved(true);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-md border border-line bg-paper-100">
      <label htmlFor="gallery-interval" className="text-sm font-medium text-navy-900 shrink-0">
        Slide interval
      </label>
      <input
        id="gallery-interval"
        type="number"
        min={1}
        max={60}
        step={0.1}
        value={seconds}
        onChange={(e) => setSeconds(parseFloat(e.target.value))}
        className="w-20 rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
      />
      <span className="text-sm text-ink-400">seconds</span>

      <button
        type="button"
        onClick={save}
        disabled={isPending || seconds === toSeconds(intervalMs)}
        className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      {saved && !isPending && <span className="text-xs text-forest">Saved.</span>}
    </div>
  );
}
