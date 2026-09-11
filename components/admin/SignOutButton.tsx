// components/admin/SignOutButton.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { LogOut, Loader2 } from "lucide-react";

export default function SignOutButton() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    if (loading) return;
    setLoading(true);

    await supabase.auth.signOut();

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
