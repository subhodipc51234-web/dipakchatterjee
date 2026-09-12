// app/global-error.tsx
//
// Root-level error boundary — catches anything that escapes every other
// boundary (including the root layout itself). Must define its own
// <html>/<body> since it replaces the root layout when active, and
// can't reach globals.css/theme tokens, so its styling is inlined.
// Uses `retry` (not `reset`) since it re-fetches/re-renders rather than
// just clearing state — see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/error.md.

"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#151F33",
          color: "#F5F1E8",
          fontFamily: "system-ui, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>Something went wrong</h1>
          <p style={{ opacity: 0.75, marginBottom: 24, lineHeight: 1.5 }}>
            An unexpected error occurred. Please try again — if this keeps happening, come back in a
            few minutes.
          </p>
          <button
            onClick={() => retry()}
            style={{
              background: "#C1832B",
              color: "#151F33",
              fontWeight: 600,
              padding: "10px 20px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
