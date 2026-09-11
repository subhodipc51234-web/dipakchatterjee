// lib/admin-guard.ts
//
// Every Server Action is a public POST endpoint regardless of which page
// renders the form that calls it — the (protected) layout's redirect is a
// render-time check, not a security boundary. Call this first in every
// admin mutation so the check is enforced server-side, independent of UI.

import { createClient } from "@/utils/supabase/server";

export async function requireAdmin() {
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
