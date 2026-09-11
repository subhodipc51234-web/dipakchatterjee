// app/admin/(protected)/complaints/ComplaintExpirySettings.tsx
"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { updateComplaintExpirationDays } from "./actions";

export default function ComplaintExpirySettings({ currentDays }: { currentDays: number }) {
  const [days, setDays] = useState(currentDays);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await updateComplaintExpirationDays(days);
        setSaved(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8 mb-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Complaint expiration</p>
      <p className="text-xs text-ink-400 mb-5">
        New complaints from the public form are permanently deleted this many days after
        submission. There is no archive &mdash; once expired, a complaint is gone for good.
      </p>

      <form onSubmit={submit} className="flex items-end gap-3">
        <div>
          <label htmlFor="expiration_days" className="block text-sm font-medium text-navy-900 mb-1.5">
            Default expiration (days)
          </label>
          <input
            id="expiration_days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-28 rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-md transition-colors"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isPending ? "Saving…" : "Save"}
        </button>

        {saved && !isPending && <span className="text-xs text-forest self-center">Saved.</span>}
      </form>

      {error && (
        <p className="text-sm text-rust mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
