// lib/complaint-status.ts
//
// Shared between the admin list (server-rendered) and the client list
// component, so status/labeling logic lives in exactly one place.

export type ComplaintStatus = "new" | "active" | "expired";

const NEW_WINDOW_MS = 24 * 60 * 60 * 1000;

export function getComplaintStatus(
  complaint: { is_expired: boolean; expires_at: string; created_at: string },
  now: number = Date.now()
): ComplaintStatus {
  if (complaint.is_expired || new Date(complaint.expires_at).getTime() <= now) return "expired";
  if (now - new Date(complaint.created_at).getTime() <= NEW_WINDOW_MS) return "new";
  return "active";
}

export function formatTimeRemaining(expiresAt: string, now: number = Date.now()): string {
  const diffMs = new Date(expiresAt).getTime() - now;

  if (diffMs <= 0) {
    const pastMs = Math.abs(diffMs);
    const days = Math.floor(pastMs / (24 * 60 * 60 * 1000));
    if (days >= 1) return `Expired ${days} day${days === 1 ? "" : "s"} ago`;
    const hours = Math.max(1, Math.floor(pastMs / (60 * 60 * 1000)));
    return `Expired ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} left`;
  const hours = Math.max(1, Math.floor(diffMs / (60 * 60 * 1000)));
  return `${hours} hour${hours === 1 ? "" : "s"} left`;
}
