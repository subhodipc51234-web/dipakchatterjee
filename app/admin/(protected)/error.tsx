// app/admin/(protected)/error.tsx
//
// Scoped to the dashboard shell (everything inside the (protected)
// group) so an unexpected error on any admin page — including one this
// audit didn't individually wrap in try/catch — shows a recoverable,
// on-brand fallback instead of Next's generic error page. Deliberately
// placed inside (protected) rather than at app/admin/ so it does NOT
// wrap /admin/login or /admin/verify-otp, which should keep rendering
// normally regardless of dashboard-side errors.

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[admin error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-100 px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl text-navy-900 mb-3">Something went wrong</h1>
        <p className="text-sm text-ink-600 mb-6 leading-relaxed">
          This page hit an unexpected error. Try again — if it keeps happening, sign out and back in.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => retry()}
            className="bg-saffron hover:bg-saffron-600 text-white font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            Try again
          </button>
          <Link
            href="/admin/login"
            className="text-sm font-semibold text-ink-600 hover:text-navy-900 px-3 py-2.5"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
