// components/admin/MyContactInfoCard.tsx
//
// Self-service "edit my contact info" entry point on the dashboard
// overview page — the one place a plain USER account can reach it,
// since Settings -> Users & Access (the admin's equivalent, for editing
// *any* profile) is admin-only. Both go through the same
// ContactInfoModal/updateContactInfo, so the same validation and
// password rules apply either way.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Pencil, Phone } from "lucide-react";
import type { Profile } from "@/types/domain";
import ContactInfoModal from "./ContactInfoModal";

export default function MyContactInfoCard({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white border border-line rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="font-semibold text-navy-900">Your contact info</p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-600 hover:text-saffron"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
      </div>

      <div className="space-y-2 text-sm text-ink-600">
        <p className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-ink-400 shrink-0" />
          {profile.email || "No email on file"}
        </p>
        <p className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-ink-400 shrink-0" />
          {profile.phone || "No phone on file"}
        </p>
      </div>

      {editing && (
        <ContactInfoModal
          profile={profile}
          viewerId={profile.id}
          viewerIsAdmin={profile.is_admin}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
