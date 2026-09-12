// lib/activity-log.ts
//
// Writes one row to dashboard_activity_logs from inside an already-
// authorized Server Action (call this after requireAdmin()/requireOwner(),
// passing along the same request-scoped `supabase` client and `user` —
// the insert relies on the caller already being a recognized admin,
// since dashboard_activity_logs' own INSERT policy is is_admin()-gated).
// Retention (24h / 20 rows) is enforced entirely by a database trigger
// (see supabase/migrations/20260922010000_dashboard_activity_logs.sql),
// not here — this is a pure "write one event" helper.

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type DashboardActivityInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  details: string;
};

/**
 * Best-effort: a failed audit-log write is logged to the server console
 * but never thrown — the admin action it's describing (the actual post/
 * phase/settings mutation) already succeeded by the time this runs, and
 * a missing log entry is far less harmful than surfacing an error for a
 * mutation that otherwise worked fine.
 */
export async function logDashboardActivity(
  supabase: SupabaseClient<Database>,
  user: Pick<User, "id" | "email">,
  input: DashboardActivityInput
) {
  const { error } = await supabase.from("dashboard_activity_logs").insert({
    user_id: user.id,
    user_email: user.email ?? "unknown",
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    details: input.details,
  });

  if (error) {
    console.error("[logDashboardActivity] insert failed:", error.message);
  }
}
