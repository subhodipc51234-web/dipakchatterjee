// app/admin/login/LoginForm.tsx
//
// Step 1 of the two-step login flow: email + password only. On success,
// requestLoginOtp() (see ./actions.ts) issues the short-lived
// admin_pending_2fa cookie and sends the OTP, so this hard-navigates on
// to /admin/verify-otp next rather than straight to /admin — except for
// the "verified" step, which grants the real dashboard session right
// away. That happens both as a fail-safe (no admin email on file
// anywhere to challenge against — see lib/otp-login.ts) and, currently,
// whenever FEATURE_FLAGS.REQUIRE_OTP is off (lib/feature-flags.ts).

"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import { requestLoginOtp } from "./actions";

export default function LoginForm({ brandName, brandSubtitle }: { brandName: string; brandSubtitle: string }) {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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
      // Hard navigation (not router.push) so the next page's server-side
      // session/cookie checks (proxy.ts, and that page's own layout) see
      // the freshly-set cookies directly, with no client router cache in
      // the mix.
      if (result.step === "verified") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- hard navigation so /admin's server-side cookie check sees the freshly-set session (see file header)
        window.location.assign("/admin");
        return;
      }
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- same reason as above
      window.location.assign("/admin/verify-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a login code.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-navy-900">{brandName}</p>
          <p className="text-sm text-ink-400 mt-1">{brandSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-6 space-y-5">
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
      </div>
    </div>
  );
}
