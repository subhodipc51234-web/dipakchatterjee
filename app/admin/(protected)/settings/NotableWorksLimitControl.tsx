// app/admin/(protected)/settings/NotableWorksLimitControl.tsx
//
// How many posts show in the homepage's Notable Works feed before a
// visitor has to go to /notable-works for the rest. Posts feed itself
// pins is_pinned rows to the top regardless of this limit.

"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateNotableWorksLimit } from "./actions";

export default function NotableWorksLimitControl({ limit }: { limit: number }) {
  const [value, setValue] = useState(limit);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    setSaved(false);
    startTransition(async () => {
      try {
        await updateNotableWorksLimit(value);
        setSaved(true);
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="flex items-center gap-3 mb-4 p-3 rounded-md border border-line bg-paper-100">
      <label htmlFor="notable-works-limit" className="text-sm font-medium text-navy-900 shrink-0">
        Homepage display limit
      </label>
      <input
        id="notable-works-limit"
        type="number"
        min={1}
        max={48}
        step={1}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10) || 1)}
        className="w-20 rounded border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-saffron focus:outline-none"
      />
      <span className="text-sm text-ink-400">posts</span>

      <button
        type="button"
        onClick={save}
        disabled={isPending || value === limit}
        className="ml-auto inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        Save
      </button>
      {saved && !isPending && <span className="text-xs text-forest">Saved.</span>}
    </div>
  );
}
