// utils/supabase/middleware.ts
//
// Called from proxy.ts on every /admin/* request. Refreshes the Supabase
// session cookie if it's close to expiring (so a logged-in admin never
// gets silently logged out mid-session) and returns the current user so
// proxy.ts can decide whether to allow or redirect the request.
//
// Takes the response to attach cookies to (rather than building its own)
// so proxy.ts can pre-attach the CSP nonce request headers to that same
// response before this function's cookie mutations run.

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";

export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            // See utils/supabase/server.ts for why `secure` needs adding
            // explicitly (@supabase/ssr's defaults don't set it at all).
            response.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === "production",
            })
          );
        },
      },
    }
  );

  // Do not remove: this call refreshes the session and must run before
  // any route logic. Using getUser() (not getSession()) because it
  // revalidates the token against Supabase Auth rather than trusting a
  // possibly-stale cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user };
}
