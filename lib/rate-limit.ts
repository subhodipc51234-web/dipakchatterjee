// lib/rate-limit.ts
//
// Minimal in-memory sliding-window-ish rate limiter for public,
// unauthenticated Server Actions (currently: complaint submission).
//
// Honest limitation: this state lives in one Node.js process's memory.
// On a single-instance deploy (one long-running Node server) it works
// correctly. On a multi-instance/serverless deploy where each request
// can land on a different process, each instance enforces its own
// separate limit rather than one shared one — an attacker distributed
// across instances could exceed the intended global rate. Closing that
// gap needs a shared store (e.g. Upstash Redis / Vercel KV), which isn't
// provisioned here. This is still a real, effective deterrent against
// casual spam/abuse from a single source, just not a distributed-system
// guarantee.

const buckets = new Map<string, { count: number; resetAt: number }>();

// Bound memory: if this ever grows unreasonably large (e.g. under a
// distributed abuse attempt hammering many distinct keys), drop the
// oldest entries rather than growing forever.
const MAX_TRACKED_KEYS = 5000;

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      const oldestKey = buckets.keys().next().value;
      if (oldestKey !== undefined) buckets.delete(oldestKey);
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) return false;

  existing.count += 1;
  return true;
}
