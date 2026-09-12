// app/admin/session-actions.ts
//
// Shared by SignOutButton (manual sign-out) and SessionTimer (automatic
// sign-out on inactivity) — both need to clear the Supabase session AND
// the OTP-verified cookie, not just one or the other.

"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { OTP_SESSION_COOKIE } from "@/lib/otp-session";

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(OTP_SESSION_COOKIE);
}
