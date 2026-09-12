// components/admin/ContactInfoModal.tsx
//
// Edits one profile's email/phone — used both from Settings -> Users &
// Access (an admin editing any row) and from the dashboard overview's
// "Your contact info" card (a plain USER editing only their own row).
// A password field appears only when the change actually needs one:
// the email is changing (a login credential), or the viewer is an
// admin editing someone else's row (a privileged action) — see
// updateContactInfo in app/admin/(protected)/settings/user-actions.ts
// for the real, server-enforced version of this same rule.

"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { Profile } from "@/types/domain";
import { updateContactInfo } from "@/app/admin/(protected)/settings/user-actions";

export default function ContactInfoModal({
  profile,
  viewerId,
  viewerIsAdmin,
  onClose,
  onSaved,
}: {
  profile: Profile;
  viewerId: string;
  viewerIsAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState(profile.email ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSelf = profile.id === viewerId;
  const emailChanged = email.trim() !== (profile.email ?? "");
  const needsPassword = emailChanged || (!isSelf && viewerIsAdmin);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await updateContactInfo({
          targetUserId: profile.id,
          email,
          phone,
          confirmPassword: needsPassword ? password : undefined,
        });
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4">
      <div className="bg-white rounded-xl border border-line p-6 w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900 mb-1">
          {isSelf ? "Your contact info" : `${profile.full_name || profile.email || "User"}'s contact info`}
        </p>
        <p className="text-xs text-ink-600 mb-4">
          Email changes update your Supabase Auth login too. The phone number is where login SMS
          codes are sent.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label htmlFor="contact-email" className="block text-xs font-medium text-navy-900 mb-1.5">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="contact-phone" className="block text-xs font-medium text-navy-900 mb-1.5">
              Phone (10-digit mobile number)
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              pattern="[0-9+\-\s()]{10,15}"
              className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
            />
          </div>

          {needsPassword && (
            <div>
              <label htmlFor="contact-password" className="block text-xs font-medium text-navy-900 mb-1.5">
                Your password (required for this change)
              </label>
              <input
                id="contact-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-rust" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || (needsPassword && !password)}
              className="inline-flex items-center gap-2 flex-1 justify-center bg-saffron hover:bg-saffron-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-sm font-medium text-ink-400 hover:text-navy-900 px-3 py-2.5 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
