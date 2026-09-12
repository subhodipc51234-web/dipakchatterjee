// components/admin/SignOutButton.tsx
"use client";

import { useState } from "react";
import { LogOut, Loader2 } from "lucide-react";
import { logoutAdmin } from "@/app/admin/session-actions";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);

    // Clears both the Supabase session and the OTP-verified cookie
    // (see app/admin/session-actions.ts) — signing out of Supabase
    // alone would leave the OTP cookie valid for its remaining TTL.
    await logoutAdmin();

    // Deliberately NOT using router.push()/router.refresh() here.
    // Calling both together races Next's client-side router cache
    // against the admin layout's server-side redirect check, which is
    // what was causing the render loop. A hard navigation guarantees
    // every server component re-reads cookies from scratch, with no
    // stale client cache involved.
    window.location.assign("/admin/login");
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-paper-100/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
