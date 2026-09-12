// components/admin/AdminResetPasswordModal.tsx
//
// Admin-only override: sets a *different* user's password without
// knowing their current one. Only ever rendered for the single ADMIN
// account, on someone else's row in Settings -> Users & Access (see
// UsersManager.tsx) — but the real boundary is server-side, in
// adminResetPassword (app/admin/(protected)/settings/user-actions.ts),
// which re-verifies the admin's own password and rejects any non-admin
// caller outright.

"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { adminResetPassword } from "@/app/admin/(protected)/settings/user-actions";
import PasswordInput from "./PasswordInput";

export default function AdminResetPasswordModal({
  targetUserId,
  targetName,
  onClose,
  onSaved,
}: {
  targetUserId: string;
  targetName: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
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

    startTransition(async () => {
      try {
        await adminResetPassword(targetUserId, adminPassword, newPassword);
        setSuccess(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reset password.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4">
      <div className="bg-white rounded-xl border border-line p-6 w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900 mb-1">Reset password</p>
        <p className="text-xs text-ink-600 mb-4">
          Sets a new password for {targetName} without needing their current one. Enter your own
          password to confirm.
        </p>

        {success ? (
          <>
            <p className="flex items-center gap-2 text-sm text-green-700 mb-4" role="status">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {targetName}&rsquo;s password was updated successfully.
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
              label="Admin password"
              value={adminPassword}
              onChange={setAdminPassword}
              autoComplete="current-password"
            />
            <PasswordInput
              label={`New password for ${targetName}`}
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              minLength={8}
              placeholder="Min. 8 characters"
            />

            {error && (
              <p className="text-xs text-rust" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending || !adminPassword || !newPassword}
                className="inline-flex items-center gap-2 flex-1 justify-center bg-saffron hover:bg-saffron-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {isPending ? "Updating…" : "Reset password"}
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
