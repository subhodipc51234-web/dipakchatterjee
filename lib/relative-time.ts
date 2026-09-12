// lib/relative-time.ts
//
// Small "X minutes ago" formatter for the activity log table. Logs are
// pruned to a 24-hour rolling window (see dashboard_activity_logs'
// trigger), so this only ever needs to express durations up to ~a day.

export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const diffSeconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));

  if (diffSeconds < 5) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;

  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"} ago`;
}
