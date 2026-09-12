// lib/admin-guard.ts
//
// Every Server Action is a public POST endpoint regardless of which page
// renders the form that calls it — the (protected) layout's redirect is a
// render-time check, not a security boundary. Call one of these first in
// every admin mutation so the check is enforced server-side, independent
// of UI.
//
// Two tiers: requireAdmin() covers content/settings edits, which ADMIN
// and MODERATOR both get full access to. requireOwner() is strictly the
// single ADMIN account — user management (add/delete/edit users, change
// roles, transfer the ADMIN role) stays owner-only. See the
// is_moderator column and the redefined is_admin() SQL function
// (supabase/migrations/20260915000000_moderator_role.sql) for the
// database-side half of this same split.

import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_moderator")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin && !profile?.is_moderator) throw new Error("Forbidden");

  return { supabase, user };
}

/**
 * Strictly the single ADMIN account — never a MODERATOR. Use this for
 * user-management actions (create/delete a user, edit someone else's
 * details, transfer the ADMIN role, change a user's role) rather than
 * requireAdmin(), which MODERATOR accounts also pass.
 */
export async function requireOwner() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) throw new Error("Forbidden");

  return { supabase, user };
}

/**
 * Like requireAdmin(), but for actions any recognized profile (ADMIN,
 * MODERATOR, or USER) may call on their own behalf — e.g. editing your
 * own contact info. Callers still need to check `profile.is_admin`
 * themselves before allowing anything scoped to *another* user's data.
 */
export async function requireProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, is_moderator, email")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Forbidden");

  return { supabase, user, profile };
}
