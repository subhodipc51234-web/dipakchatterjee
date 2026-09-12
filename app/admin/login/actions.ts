// app/admin/login/actions.ts
//
// The second factor of login: called after the client has already
// completed supabase.auth.signInWithPassword (see page.tsx), so
// `createClient().auth.getUser()` here already sees the freshly
// authenticated user via the request's cookies.

"use server";

import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { requestLoginOtp as requestOtp, verifyLoginOtp as verifyOtp } from "@/lib/otp-login";
import {
  OTP_SESSION_COOKIE,
  OTP_SESSION_TTL_SECONDS,
  createOtpSessionToken,
  otpSessionCookieOptions,
} from "@/lib/otp-session";

export type RequestOtpResult =
  | { step: "otp_required"; channels: { email: boolean; sms: boolean } }
  // No email/SMS provider configured — the challenge is skipped and the
  // session is granted immediately (see lib/otp-login.ts's fail-safe).
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
    return { step: "cooldown", retryAfterSeconds: result.retryAfterSeconds };
  }
  return { step: "otp_required", channels: result.channels };
}

export async function verifyLoginOtp(code: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your sign-in session expired. Please sign in again." };

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

  await grantOtpSession(user.id);
  return { ok: true };
}

async function grantOtpSession(userId: string) {
  const token = createOtpSessionToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(OTP_SESSION_COOKIE, token, otpSessionCookieOptions(OTP_SESSION_TTL_SECONDS));
}
