// lib/otp-session.ts
//
// Two signed, HTTP-only cookies for the two-step login flow (see
// app/admin/login/actions.ts and proxy.ts):
//
//   - admin_pending_2fa: set the instant a password check succeeds.
//     Proves "this browser just authenticated as this user" without
//     granting dashboard access — proxy.ts uses its presence (without a
//     verified session) to redirect straight to /admin/verify-otp
//     instead of bouncing back to /admin/login.
//   - admin_otp_session: set only once the 6-digit code is verified.
//     This is the actual dashboard session; its expiry doubles as the
//     15-minute inactivity timer — the heartbeat endpoint
//     (app/api/admin/heartbeat/route.ts) re-signs it with a fresh
//     15-minute window on user activity, and once it lapses the admin
//     is treated as logged out even if the underlying Supabase session
//     is still technically valid.
//
// Token shape: "<purpose>.<userId>.<expiryMs>.<hmacHex>" — HMAC-SHA256
// keyed by APP_ENCRYPTION_KEY. The purpose tag is signed as part of the
// payload specifically so a pending_2fa token (obtainable before OTP is
// ever checked) can't be replayed as an otp_verified token even though
// both cookies share the same signing secret and payload shape —
// without it, copying a pending cookie's value into the verified
// cookie's slot would pass signature verification and skip OTP
// entirely. Nothing here is encryption (there's no secret payload to
// hide, just a userId), only tamper-proofing.

import { createHmac, timingSafeEqual } from "crypto";

export const OTP_SESSION_COOKIE = "admin_otp_session";
export const OTP_SESSION_TTL_SECONDS = 15 * 60; // 15 minutes, per the inactivity timer

export const PENDING_2FA_COOKIE = "admin_pending_2fa";
// Matches OTP_TTL_MS in lib/otp.ts — no reason for the "you're mid-2FA"
// window to outlive the code itself.
export const PENDING_2FA_TTL_SECONDS = 5 * 60;

type TokenPurpose = "otp_verified" | "pending_2fa";

function secret(): string {
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set — required to sign the admin session cookies. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return key;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

function createToken(purpose: TokenPurpose, userId: string, ttlSeconds: number): string {
  const exp = Date.now() + ttlSeconds * 1000;
  const payload = `${purpose}.${userId}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

function verifyToken(purpose: TokenPurpose, token: string | undefined | null): { userId: string; exp: number } | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [tokenPurpose, userId, expStr, sig] = parts;
  if (tokenPurpose !== purpose) return null;

  const exp = Number(expStr);
  if (!userId || !Number.isFinite(exp)) return null;

  let expectedSig: string;
  try {
    // Runs on every /admin request in proxy.ts — fail safe (treat as
    // "not verified", not a crashed request) if APP_ENCRYPTION_KEY is
    // ever missing, rather than throwing out of the middleware.
    expectedSig = sign(`${tokenPurpose}.${userId}.${expStr}`);
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

export function createOtpSessionToken(userId: string, ttlSeconds: number = OTP_SESSION_TTL_SECONDS): string {
  return createToken("otp_verified", userId, ttlSeconds);
}

export function verifyOtpSessionToken(token: string | undefined | null): { userId: string; exp: number } | null {
  return verifyToken("otp_verified", token);
}

export function createPending2faToken(userId: string, ttlSeconds: number = PENDING_2FA_TTL_SECONDS): string {
  return createToken("pending_2fa", userId, ttlSeconds);
}

export function verifyPending2faToken(token: string | undefined | null): { userId: string; exp: number } | null {
  return verifyToken("pending_2fa", token);
}

/** Standard cookie options for setting/clearing either session cookie. */
export function otpSessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
