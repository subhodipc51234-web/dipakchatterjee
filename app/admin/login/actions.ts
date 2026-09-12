// app/admin/login/actions.ts
//
// The two-step login flow:
//   1. requestLoginOtp — called right after the client's own
//      supabase.auth.signInWithPassword succeeds (see LoginForm.tsx),
//      so createClient().auth.getUser() here already sees the freshly
//      authenticated user via the request's cookies. Issues the
//      short-lived admin_pending_2fa cookie and sends the OTP — it
//      never grants the real dashboard session itself.
//   2. verifyLoginOtp — called from /admin/verify-otp (VerifyOtpForm.tsx).
//      Requires a valid, matching admin_pending_2fa cookie (belt and
//      suspenders alongside proxy.ts's own enforcement of the same
//      rule) before it will even check the submitted code, and only
//      grants the real admin_otp_session cookie on success.

"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { requestLoginOtp as requestOtp, verifyLoginOtp as verifyOtp } from "@/lib/otp-login";
import {
  OTP_SESSION_COOKIE,
  OTP_SESSION_TTL_SECONDS,
  PENDING_2FA_COOKIE,
  PENDING_2FA_TTL_SECONDS,
  createOtpSessionToken,
  createPending2faToken,
  verifyPending2faToken,
  otpSessionCookieOptions,
} from "@/lib/otp-session";

export type RequestOtpResult =
  | { step: "otp_required" }
  // Fail-safe only: the admin profile has no email on file at all, so
  // there's truly nowhere to send a challenge — see lib/otp-login.ts.
  | { step: "verified" }
  | { step: "cooldown"; retryAfterSeconds: number };

export async function requestLoginOtp(): Promise<RequestOtpResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const result = await requestOtp(user.id);

  if (result.status === "skipped") {
    await grantOtpSession(user.id);
    return { step: "verified" };
  }
  if (result.status === "cooldown") {
    // A code from a moments-ago request is still live — make sure the
    // pending cookie covers it too, so /admin/verify-otp stays reachable.
    await grantPending2fa(user.id);
    return { step: "cooldown", retryAfterSeconds: result.retryAfterSeconds };
  }

  await grantPending2fa(user.id);
  return { step: "otp_required" };
}

export async function verifyLoginOtp(code: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your sign-in session expired. Please sign in again." };

  const cookieStore = await cookies();
  const pending = verifyPending2faToken(cookieStore.get(PENDING_2FA_COOKIE)?.value);
  if (!pending || pending.userId !== user.id) {
    return { ok: false, message: "Your verification session expired. Please sign in again." };
  }

  const result = await verifyOtp(user.id, code.trim());
  if (!result.ok) {
    switch (result.reason) {
      case "invalid":
        return { ok: false, message: "Incorrect code. Please try again." };
      case "expired":
        return { ok: false, message: "That code has expired. Request a new one." };
      case "too_many_attempts":
        return { ok: false, message: "Too many incorrect attempts. Request a new code." };
      case "not_found":
        return { ok: false, message: "No active code found. Request a new one." };
    }
  }

  cookieStore.delete(PENDING_2FA_COOKIE);
  await grantOtpSession(user.id);
  return { ok: true };
}

async function grantPending2fa(userId: string) {
  const token = createPending2faToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(PENDING_2FA_COOKIE, token, otpSessionCookieOptions(PENDING_2FA_TTL_SECONDS));
}

async function grantOtpSession(userId: string) {
  const token = createOtpSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(OTP_SESSION_COOKIE, token, otpSessionCookieOptions(OTP_SESSION_TTL_SECONDS));
}
