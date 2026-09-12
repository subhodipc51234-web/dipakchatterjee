// app/admin/(protected)/settings/UsersManager.tsx
//
// Settings -> Users & Access. Every recognized profile (ADMIN or USER)
// can reach the Settings page, view this list, and add a new user —
// see page.tsx's gate. Transferring the ADMIN role and deleting a user
// are owner-only (`viewerIsOwner`, true only for the single ADMIN); a
// standard USER sees the same list, plus an "Edit contact" button on
// their own row only. The ADMIN's own row never gets a delete/transfer
// action: it can't be deleted, and role only ever changes via Transfer
// Admin, never in place.

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Crown, KeyRound, Loader2, Pencil, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import type { Profile } from "@/types/domain";
import { createUserAccount, deleteUserAccount, transferAdminRole } from "./user-actions";
import ContactInfoModal from "@/components/admin/ContactInfoModal";
import ChangePasswordModal from "@/components/admin/ChangePasswordModal";
import AdminResetPasswordModal from "@/components/admin/AdminResetPasswordModal";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type PendingAction = { kind: "delete" | "transfer"; userId: string; name: string } | null;

export default function UsersManager({
  users,
  viewerId,
  viewerIsOwner,
}: {
  users: Profile[];
  viewerId: string;
  /** True only for the single ADMIN account — transfer/delete are hidden from every other viewer. */
  viewerIsOwner: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction>(null);
  const [editingContact, setEditingContact] = useState<Profile | null>(null);
  const [changingOwnPassword, setChangingOwnPassword] = useState(false);
  const [resettingPasswordFor, setResettingPasswordFor] = useState<Profile | null>(null);

  const admin = users.find((u) => u.is_admin);
  const others = users.filter((u) => !u.is_admin);

  function refresh() {
    router.refresh();
  }

  return (
    <div className="bg-white border border-line rounded-xl p-6 md:p-8">
      <p className="text-sm font-semibold text-navy-900 mb-1">Users &amp; Access</p>
      <p className="text-xs text-ink-400 mb-5">
        Exactly one account holds the ADMIN role at any time. Every USER has full content and
        settings access, including adding new users.
        {viewerIsOwner
          ? " Transferring Admin or deleting a user asks for your current password to confirm."
          : " Only the ADMIN account can transfer its role or remove a user."}
      </p>

      <ul className="space-y-2 mb-6">
        {admin && (
          <UserRow
            key={admin.id}
            profile={admin}
            viewerIsOwner={viewerIsOwner}
            isSelf={admin.id === viewerId}
            onEditContact={() => setEditingContact(admin)}
            onChangeOwnPassword={admin.id === viewerId ? () => setChangingOwnPassword(true) : undefined}
          />
        )}
        {others.map((u) => (
          <UserRow
            key={u.id}
            profile={u}
            viewerIsOwner={viewerIsOwner}
            isSelf={u.id === viewerId}
            onEditContact={() => setEditingContact(u)}
            onChangeOwnPassword={u.id === viewerId ? () => setChangingOwnPassword(true) : undefined}
            onDelete={
              viewerIsOwner
                ? () => setPending({ kind: "delete", userId: u.id, name: u.full_name || u.email || "this user" })
                : undefined
            }
            onTransfer={
              viewerIsOwner
                ? () => setPending({ kind: "transfer", userId: u.id, name: u.full_name || u.email || "this user" })
                : undefined
            }
            onResetPassword={viewerIsOwner ? () => setResettingPasswordFor(u) : undefined}
          />
        ))}
      </ul>

      <AddUserForm onCreated={refresh} />

      {pending && (
        <PasswordConfirmModal
          pending={pending}
          onClose={() => setPending(null)}
          onDone={() => {
            setPending(null);
            refresh();
          }}
        />
      )}

      {editingContact && (
        <ContactInfoModal
          profile={editingContact}
          viewerId={viewerId}
          viewerIsAdmin={viewerIsOwner}
          onClose={() => setEditingContact(null)}
          onSaved={() => {
            setEditingContact(null);
            refresh();
          }}
        />
      )}

      {changingOwnPassword && (
        <ChangePasswordModal
          onClose={() => setChangingOwnPassword(false)}
          onSaved={() => setChangingOwnPassword(false)}
        />
      )}

      {resettingPasswordFor && (
        <AdminResetPasswordModal
          targetUserId={resettingPasswordFor.id}
          targetName={resettingPasswordFor.full_name || resettingPasswordFor.email || "this user"}
          onClose={() => setResettingPasswordFor(null)}
          onSaved={() => setResettingPasswordFor(null)}
        />
      )}
    </div>
  );
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  ADMIN: "bg-saffron-100 text-saffron-600",
  USER: "bg-paper-100 text-ink-400 border border-line",
};

function UserRow({
  profile,
  viewerIsOwner,
  isSelf,
  onEditContact,
  onChangeOwnPassword,
  onDelete,
  onTransfer,
  onResetPassword,
}: {
  profile: Profile;
  viewerIsOwner: boolean;
  isSelf: boolean;
  onEditContact: () => void;
  onChangeOwnPassword?: () => void;
  onDelete?: () => void;
  onTransfer?: () => void;
  onResetPassword?: () => void;
}) {
  const roleLabel = profile.is_admin ? "ADMIN" : "USER";
  // Anyone can edit their own contact info; only the owner can edit
  // someone else's (matches the server-side rule in updateContactInfo).
  const canEditContact = isSelf || viewerIsOwner;

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-white p-3">
      <div className="flex-1 min-w-[180px]">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-navy-900">{profile.full_name || "Unnamed"}</p>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded ${ROLE_BADGE_STYLES[roleLabel]}`}
          >
            {profile.is_admin && <Crown className="w-3 h-3" />}
            {roleLabel}
          </span>
        </div>
        <p className="text-xs text-ink-400 mt-0.5">Email: {profile.email || "No email on file"}</p>
        <p className="text-xs text-ink-400 mt-0.5">Phone: {profile.phone || "No phone on file"}</p>
        <p className="text-[11px] text-ink-300 mt-0.5">Joined {formatDate(profile.created_at)}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canEditContact && (
          <button
            type="button"
            onClick={onEditContact}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-navy-900 border border-line hover:border-navy-900/30 rounded-md px-2.5 py-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit contact
          </button>
        )}

        {isSelf && onChangeOwnPassword && (
          <button
            type="button"
            onClick={onChangeOwnPassword}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-navy-900 border border-line hover:border-navy-900/30 rounded-md px-2.5 py-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Change Password
          </button>
        )}

        {!isSelf && onResetPassword && (
          <button
            type="button"
            onClick={onResetPassword}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-600 hover:text-navy-900 border border-line hover:border-navy-900/30 rounded-md px-2.5 py-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
            Reset Password
          </button>
        )}

        {!profile.is_admin && onTransfer && (
          <button
            type="button"
            onClick={onTransfer}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron border border-saffron/30 hover:border-saffron/60 rounded-md px-2.5 py-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Transfer Admin
          </button>
        )}

        {!profile.is_admin && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete user"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-rust hover:text-rust/80 border border-rust/30 hover:border-rust/60 rounded-md px-2.5 py-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        )}
      </div>
    </li>
  );
}

function AddUserForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createUserAccount({ name, email, phone, password });
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        onCreated();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create user.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-navy-900 mb-3">Add a user</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          required
          className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          type="tel"
          placeholder="Phone (optional)"
          className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password (min. 8 characters)"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
        />
      </div>

      <p className="text-xs text-ink-400 mt-3">New accounts are always created as a standard USER.</p>

      {error && (
        <p className="text-xs text-rust mt-3" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex items-center gap-2 bg-navy-900 hover:bg-navy-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isPending ? "Adding…" : "Add user"}
      </button>
    </form>
  );
}

function PasswordConfirmModal({
  pending,
  onClose,
  onDone,
}: {
  pending: NonNullable<PendingAction>;
  onClose: () => void;
  onDone: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDelete = pending.kind === "delete";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        if (isDelete) {
          await deleteUserAccount(pending.userId, password);
        } else {
          await transferAdminRole(pending.userId, password);
        }
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 px-4">
      <div className="bg-white rounded-xl border border-line p-6 w-full max-w-sm">
        <p className="text-sm font-semibold text-navy-900 mb-1">
          {isDelete ? "Delete user" : "Transfer Admin role"}
        </p>
        <p className="text-xs text-ink-600 mb-4">
          {isDelete
            ? `This permanently deletes ${pending.name}'s account. Enter your password to confirm.`
            : `${pending.name} will become the sole ADMIN and you'll be downgraded to a standard USER. Enter your password to confirm.`}
        </p>

        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your current password"
            autoFocus
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-saffron focus:outline-none"
          />

          {error && (
            <p className="text-xs text-rust" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={isPending || !password}
              className={`inline-flex items-center gap-2 flex-1 justify-center text-sm font-semibold px-4 py-2.5 rounded-md text-white transition-colors disabled:opacity-50 ${
                isDelete ? "bg-rust hover:bg-rust/90" : "bg-saffron hover:bg-saffron-600"
              }`}
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Working…" : isDelete ? "Delete account" : "Transfer Admin role"}
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
