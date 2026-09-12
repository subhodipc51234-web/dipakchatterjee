// lib/otp-login.ts
//
// Orchestrates a login OTP challenge: generate, hash + store, send to
// both channels simultaneously, and verify a submitted code. Always
// uses the service-role client (admin_otp_codes has no client-facing
// RLS policies at all — see the migration).
//
// The OTP always goes to the site's single ADMIN profile's email/phone
// (not necessarily whichever account is logging in) — this is a small,
// single-admin site where the admin is meant to be the one gatekeeping
// every login, including a USER account's. See
// app/admin/login/actions.ts for how this plugs into the login flow.
//
// Fail-safe by design: if neither email nor SMS is configured (no
// provider env vars set), requestLoginOtp *skips* the challenge rather
// than issuing a code nobody can ever receive — otherwise the very
// first deploy of this feature would permanently lock the admin out of
// their own dashboard. Configure RESEND_API_KEY/RESEND_FROM_EMAIL
// and/or a SMS provider (see lib/notify/sms.ts) to turn the challenge on.

import { createServiceClient } from "@/utils/supabase/admin";
import { generateOtp, hashOtp, verifyOtpHash, OTP_TTL_MS, OTP_MAX_ATTEMPTS } from "@/lib/otp";
import { sendOtpEmail, type EmailResult } from "@/lib/notify/email";
import { sendOtpSms, type SmsResult } from "@/lib/notify/sms";

const RESEND_COOLDOWN_MS = 30 * 1000;

export type OtpRequestResult =
  | { status: "sent"; channels: { email: boolean; sms: boolean } }
  | { status: "skipped" }
  | { status: "cooldown"; retryAfterSeconds: number };

export async function requestLoginOtp(userId: string): Promise<OtpRequestResult> {
  const supabase = createServiceClient();

  const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
  const smsConfigured = Boolean(
    process.env.FAST2SMS_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER)
  );

  if (!emailConfigured && !smsConfigured) {
    console.warn("[otp] No email or SMS provider configured — skipping the OTP challenge. See .env.example.");
    return { status: "skipped" };
  }

  const { data: mostRecent } = await supabase
    .from("admin_otp_codes")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (mostRecent) {
    const elapsed = Date.now() - new Date(mostRecent.created_at).getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      return { status: "cooldown", retryAfterSeconds: Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000) };
    }
  }

  // The OTP is delivered to the site's ADMIN contact info regardless of
  // who's logging in.
  const { data: admin } = await supabase
    .from("profiles")
    .select("email, phone")
    .eq("is_admin", true)
    .single();

  const code = generateOtp();
  const codeHash = hashOtp(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  await supabase.from("admin_otp_codes").delete().eq("user_id", userId).is("consumed_at", null);

  const { error } = await supabase.from("admin_otp_codes").insert({
    user_id: userId,
    code_hash: codeHash,
    expires_at: expiresAt,
  });
  if (error) throw new Error(error.message);

  const [emailResult, smsResult] = await Promise.all([
    emailConfigured && admin?.email
      ? sendOtpEmail(admin.email, code)
      : Promise.resolve<EmailResult>({ sent: false, skipped: true }),
    smsConfigured && admin?.phone
      ? sendOtpSms(admin.phone, code)
      : Promise.resolve<SmsResult>({ sent: false, skipped: true }),
  ]);

  if (emailResult.error) console.error("[otp] email send failed:", emailResult.error);
  if (smsResult.error) console.error("[otp] sms send failed:", smsResult.error);

  if (!emailResult.sent && !smsResult.sent) {
    throw new Error(
      "Could not send the login code by email or SMS. Check that the admin profile has an email/phone set and that the provider credentials in .env.local are correct."
    );
  }

  return { status: "sent", channels: { email: emailResult.sent, sms: smsResult.sent } };
}

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "not_found" };

export async function verifyLoginOtp(userId: string, code: string): Promise<OtpVerifyResult> {
  const supabase = createServiceClient();

  const { data: row } = await supabase
    .from("admin_otp_codes")
    .select("*")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false, reason: "not_found" };

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }

  if (!verifyOtpHash(code, row.code_hash)) {
    await supabase
      .from("admin_otp_codes")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id);
    return { ok: false, reason: "invalid" };
  }

  await supabase.from("admin_otp_codes").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);
  return { ok: true };
}
