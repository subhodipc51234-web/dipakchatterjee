// app/api/admin/heartbeat/route.ts
//
// Lightweight endpoint SessionTimer calls on user activity to slide the
// 15-minute inactivity window forward without a full page reload.
// Requires an already-valid OTP session (won't resurrect an expired or
// missing one — that's a fresh login, not a heartbeat).

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import {
  OTP_SESSION_COOKIE,
  OTP_SESSION_TTL_SECONDS,
  createOtpSessionToken,
  otpSessionCookieOptions,
  verifyOtpSessionToken,
} from "@/lib/otp-session";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const cookieStore = await cookies();
  const existing = verifyOtpSessionToken(cookieStore.get(OTP_SESSION_COOKIE)?.value);

  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const token = createOtpSessionToken(user.id);
  cookieStore.set(OTP_SESSION_COOKIE, token, otpSessionCookieOptions(OTP_SESSION_TTL_SECONDS));

  return NextResponse.json({ ok: true, expiresInSeconds: OTP_SESSION_TTL_SECONDS });
}
