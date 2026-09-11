// utils/supabase/client.ts
//
// Use this inside Client Components ("use client") that need to talk to
// Supabase directly from the browser — e.g. the MediaUploader's direct
// Storage upload, or the login form's signInWithPassword call.
//
// Never use this file's client for privileged operations; it always runs
// with the public anon key and is subject to RLS.

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
