// utils/supabase/server.ts
//
// Use this inside Server Components, Server Actions, and Route Handlers.
// It reads the user's session from cookies, so every query automatically
// runs as that authenticated user (or as "anon" if logged out) — RLS then
// decides what they can see or change.
//
// IMPORTANT: create a *new* client per request by calling createClient()
// inside the function that needs it. Do not cache/reuse a single instance
// across requests — cookies differ per request.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              // @supabase/ssr's default cookie options don't set `secure`
              // at all (httpOnly:false and sameSite:lax are deliberate —
              // the browser-side Supabase client needs to read this
              // cookie directly via document.cookie to stay in sync, and
              // sameSite:lax already covers CSRF for top-level nav). Add
              // `secure` ourselves so the cookie is never sent in the
              // clear once deployed over HTTPS.
              cookieStore.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === "production",
              })
            );
          } catch {
            // setAll is called from a Server Component in some cases
            // (e.g. during a page render, not an action). Next.js
            // forbids writing cookies there — this is safe to ignore
            // because middleware.ts refreshes the session on every
            // request anyway.
          }
        },
      },
    }
  );
}
