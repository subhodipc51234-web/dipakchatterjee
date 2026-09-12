// lib/otp-session.ts
//
// The "OTP verified" session: a signed, HTTP-only cookie set once a
// login OTP is confirmed (see app/admin/login/actions.ts), required by
// proxy.ts for every /admin (and /dashboard) request in addition to
// the normal Supabase session. Its expiry doubles as the 15-minute
// inactivity timer — the heartbeat endpoint
// (app/api/admin/heartbeat/route.ts) re-signs it with a fresh
// 15-minute window on user activity, and once it lapses the admin is
// treated as logged out even if the underlying Supabase session is
// still technically valid.
//
// Token shape: "<userId>.<expiryMs>.<hmacHex>" — HMAC-SHA256 keyed by
// APP_ENCRYPTION_KEY so it can't be forged or extended without the
// server secret. Nothing here is encryption (there's no secret payload
// to hide, just a userId), only tamper-proofing.

import { createHmac, timingSafeEqual } from "crypto";

export const OTP_SESSION_COOKIE = "admin_otp_session";
export const OTP_SESSION_TTL_SECONDS = 15 * 60; // 15 minutes, per the inactivity timer

function secret(): string {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set — required to sign the admin session cookie. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return key;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

export function createOtpSessionToken(userId: string, ttlSeconds: number = OTP_SESSION_TTL_SECONDS): string {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyOtpSessionToken(token: string | undefined | null): { userId: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp)) return null;

  let expectedSig: string;
  try {
    // Runs on every /admin request in proxy.ts — fail safe (treat as
    // "not verified", not a crashed request) if APP_ENCRYPTION_KEY is
    // ever missing, rather than throwing out of the middleware.
    expectedSig = sign(`${userId}.${expStr}`);
  } catch (err) {
    console.error("[otp-session] cannot verify session cookie:", err instanceof Error ? err.message : err);
    return null;
  }

  const a = Buffer.from(sig, "hex");
  const b = Buffer.from(expectedSig, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (Date.now() > exp) return null;

  return { userId, exp };
}

/** Standard cookie options for setting/clearing the OTP session cookie. */
export function otpSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
