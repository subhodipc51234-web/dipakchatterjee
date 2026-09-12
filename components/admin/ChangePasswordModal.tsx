// components/admin/ChangePasswordModal.tsx
//
// Self-service password change — any recognized profile, own account
// only. Reachable from the dashboard overview's "Your contact info"
// card and from a user's own row in Settings -> Users & Access. The
// actual verification (currentPassword re-checked against Supabase
// Auth) happens server-side in changeOwnPassword — see
// app/admin/(protected)/settings/user-actions.ts.

"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { changeOwnPassword } from "@/app/admin/(protected)/settings/user-actions";
import PasswordInput from "./PasswordInput";

export default function ChangePasswordModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    startTransition(async () => {
      try {
        await changeOwnPassword(currentPassword, newPassword);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to change password.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4">
      <div className="bg-white rounded-xl border border-line p-6 w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900 mb-4">Change your password</p>

        {success ? (
          <>
            <p className="flex items-center gap-2 text-sm text-green-700 mb-4" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Password updated successfully.
            </p>
            <button
              type="button"
              onClick={onSaved}
              className="w-full bg-saffron hover:bg-saffron-600 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
            >
              Done
            </button>
          </>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <PasswordInput
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordInput
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              placeholder="Min. 8 characters"
            />
            <PasswordInput
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              minLength={8}
            />

            {error && (
              <p className="text-xs text-rust" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending || !currentPassword || !newPassword || !confirmPassword}
                className="inline-flex items-center gap-2 flex-1 justify-center bg-saffron hover:bg-saffron-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Updating…" : "Update password"}
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
        )}
      </div>
    </div>
  );
}
