// proxy.ts  (project root — replaces middleware.ts under Next.js 16)
//
// Runs on every request (matcher below excludes only static assets).
// Two independent jobs:
//
//   1. Security headers, site-wide: a fresh per-request CSP nonce is
//      generated and set on both the outgoing request (so Next.js's own
//      hydration/RSC inline scripts pick it up automatically — see
//      node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md)
//      and the response (so the browser enforces it). This requires
//      every page to render dynamically — /admin/login and the 404 page
//      are explicitly forced dynamic (see their files) specifically so
//      this holds site-wide with no exceptions.
//
//   2. Admin auth gate, /admin/* (and /dashboard/*, reserved for the
//      same protected area) only: refresh the Supabase session and
//      require BOTH a Supabase user AND a valid, non-expired OTP
//      session cookie (see lib/otp-session.ts) — the second factor
//      completed at login. Redirects an unauthenticated or
//      OTP-unverified visitor to /admin/login, and a fully verified
//      admin away from /admin/login. Scoped to these prefixes so public
//      pages never pay for an extra Supabase auth round trip.
//
// Note: proxy.ts always runs on the Node.js runtime (not Edge), so the
// full Supabase SSR client works here without any edge-compatibility
// workarounds.

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import { OTP_SESSION_COOKIE, verifyOtpSessionToken } from "@/lib/otp-session";

function supabaseHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host;
  } catch {
    return "";
  }
}

const SUPABASE_HOST = supabaseHost();

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";

  // style-src allows 'unsafe-inline': the site's dynamic theming (CTA
  // button colors, the gallery's transform/transition, per-request CSS
  // custom properties) relies on inline `style="..."` attributes, which
  // CSP nonces cannot cover (nonces only apply to <style> elements, not
  // to the style attribute on arbitrary elements). script-src is kept
  // strict — that's the directive that actually stops injected-script
  // XSS — so this is a deliberate, scoped trade-off, not a blanket
  // weakening of the policy.
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://${SUPABASE_HOST};
    media-src 'self' https://${SUPABASE_HOST};
    connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST};
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.facebook.com https://www.instagram.com;
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin") || pathname.startsWith("/dashboard");

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isAdminRoute) {
    const { user } = await updateSession(request, response);
    const isLoginRoute = pathname === "/admin/login";

    const otpToken = request.cookies.get(OTP_SESSION_COOKIE)?.value;
    const otpSession = verifyOtpSessionToken(otpToken);
    // The OTP session cookie is bound to whichever user completed the
    // challenge — a stale cookie from a previous account (or a signed
    // session for a user who's since signed out) doesn't count.
    const isOtpVerified = Boolean(user && otpSession && otpSession.userId === user.id);

    if (!isLoginRoute && !isOtpVerified) {
      response = NextResponse.redirect(new URL("/admin/login", request.url));
    } else if (isLoginRoute && isOtpVerified) {
      response = NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
