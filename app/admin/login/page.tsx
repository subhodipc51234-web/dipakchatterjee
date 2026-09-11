// app/admin/login/page.tsx
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Incorrect email or password. Please try again.");
      setLoading(false);
      return;
    }

    // Hard navigation (not router.push/refresh) so /admin/layout.tsx's
    // server-side session check reads the freshly-set cookie directly,
    // with no client router cache in the mix — same fix as SignOutButton.
    window.location.assign("/admin");
  }

  return (
    <div className="min-h-screen bg-paper-100 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl text-navy-900">
            Dipak Chatterjee
          </p>
          <p className="text-sm text-ink-400 mt-1">Admin Dashboard</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-line rounded-xl p-6 space-y-5"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-navy-900 mb-1.5"
            >
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
            <label
              htmlFor="password"
              className="block text-sm font-medium text-navy-900 mb-1.5"
            >
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
