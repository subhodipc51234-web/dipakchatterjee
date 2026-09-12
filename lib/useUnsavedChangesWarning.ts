// lib/useUnsavedChangesWarning.ts
//
// Reusable "are you sure you want to leave" guard for dashboard forms
// with unsaved edits (post editor, settings forms, the header
// navigation builder, ...). Two layers:
//
//   1. `beforeunload` — covers closing the tab, reloading, or typing a
//      new URL. The browser shows its own native confirmation; we
//      don't control its wording (per spec, no custom message is
//      shown in modern browsers).
//   2. A capturing `click` listener on same-origin `<a>` elements —
//      covers clicking a Next.js `<Link>` (sidebar nav, "Back to
//      Posts", etc.) while a form is dirty. Next.js's Link checks
//      `event.defaultPrevented` before navigating, so calling
//      `preventDefault()` here (in the capture phase, ahead of Link's
//      own bubble-phase handler) reliably blocks the navigation when
//      the admin cancels the confirmation.
//
// There's no official App Router API to intercept `router.push` calls
// that don't originate from a click (e.g. a redirect fired from other
// code), so this only covers link-driven navigation — the overwhelming
// majority of how an admin actually leaves one dashboard page for
// another.

"use client";

import { useEffect } from "react";

const DEFAULT_MESSAGE = "You have unsaved changes. Leave this page without saving?";

export function useUnsavedChangesWarning(isDirty: boolean, message: string = DEFAULT_MESSAGE) {
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    function handleClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as HTMLElement | null)?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty, message]);
}
