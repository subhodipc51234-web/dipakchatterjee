// app/(site)/error.tsx
//
// Scoped to every public page. Same rationale as the admin boundary:
// covers any public-side data loader (home page, posts, phases,
// notable-works) that fails unexpectedly, without a generic Next error
// page replacing the whole site for a visitor.

"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[site error boundary]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-100 px-6">
      <div className="max-w-sm text-center">
        <h1 className="font-display text-2xl text-navy-900 mb-3">Something went wrong</h1>
        <p className="text-sm text-ink-600 mb-6 leading-relaxed">
          This page couldn&rsquo;t load. Please try again in a moment.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => retry()}
            className="bg-saffron hover:bg-saffron-600 text-white font-semibold px-5 py-2.5 rounded-md transition-colors"
          >
            Try again
          </button>
          <Link href="/" className="text-sm font-semibold text-ink-600 hover:text-navy-900 px-3 py-2.5">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
