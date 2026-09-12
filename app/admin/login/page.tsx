"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, ShieldCheck } from "lucide-react";
import { requestLoginOtp, verifyLoginOtp } from "./actions";

const RESEND_COOLDOWN_SECONDS = 30;

export default function LoginPage() {
  const supabase = createClient();

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    try {
      const result = await requestLoginOtp();
      if (result.step === "verified") {
        // No email/SMS provider configured server-side — the OTP
        // challenge was skipped and the session already granted.
        window.location.assign("/admin");
        return;
      }
      if (result.step === "cooldown") {
        setError(`A code was already sent recently. Try again in ${result.retryAfterSeconds}s.`);
        setResendCooldown(result.retryAfterSeconds);
        setStep("otp");
        setLoading(false);
        return;
      }
      setChannels(result.channels);
      setStep("otp");
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a login code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await verifyLoginOtp(code);
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      // Hard navigation (not router.push/refresh) so /admin/layout.tsx's
      // server-side session check reads the freshly-set cookies
      // directly, with no client router cache in the mix.
      window.location.assign("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const result = await requestLoginOtp();
      if (result.step === "verified") {
        window.location.assign("/admin");
        return;
      }
      if (result.step === "cooldown") {
        setResendCooldown(result.retryAfterSeconds);
        setError(`Please wait ${result.retryAfterSeconds}s before requesting another code.`);
        return;
      }
      setChannels(result.channels);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not resend the code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-navy-900">Dipak Chatterjee</p>
          <p className="text-sm text-ink-400 mt-1">Admin Dashboard</p>
        </div>

        {step === "credentials" ? (
          <form
            onSubmit={handleCredentialsSubmit}
            className="bg-white border border-line rounded-xl p-6 space-y-5"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-900 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-navy-900 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-sm text-ink focus:border-saffron focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-rust" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className="bg-white border border-line rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-navy-900">
              <ShieldCheck className="w-5 h-5 text-saffron-600 shrink-0" />
              <p className="text-sm font-semibold">Enter your verification code</p>
            </div>
            <p className="text-xs text-ink-400 -mt-3">
              {channels?.email && channels?.sms
                ? "A 6-digit code was sent to the admin's email and phone."
                : channels?.email
                  ? "A 6-digit code was sent to the admin's email."
                  : channels?.sms
                    ? "A 6-digit code was sent to the admin's phone."
                    : "Enter the 6-digit code."}
            </p>

            <div>
              <label htmlFor="otp" className="sr-only">
                6-digit code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full rounded-md border border-line bg-white px-4 py-3 text-center text-2xl tracking-[0.5em] text-ink focus:border-saffron focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-rust" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-saffron hover:bg-saffron-600 disabled:opacity-60 text-white font-semibold py-3 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={loading || resendCooldown > 0}
              className="w-full text-xs font-semibold text-ink-400 hover:text-navy-900 disabled:opacity-60 disabled:hover:text-ink-400"
            >
              {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Resend code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
