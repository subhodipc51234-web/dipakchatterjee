// lib/hooks/usePrefersReducedMotion.ts
//
// Tracks the "prefers-reduced-motion: reduce" media query reactively
// (flips live if the OS setting changes while the page is open) without
// an effect+setState round trip: useSyncExternalStore's server snapshot
// is `false` (SSR has no window to query) and its client snapshot reads
// the query directly, so React reconciles the SSR-vs-client difference
// as part of the hydration it already does, rather than this component
// causing an extra render pass itself.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getClientSnapshot() {
  return window.matchMedia(QUERY).matches;
}

function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
