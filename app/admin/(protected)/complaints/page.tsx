// app/admin/(protected)/complaints/page.tsx
import { createClient } from "@/utils/supabase/server";
import { purgeExpiredComplaints } from "@/lib/complaints-cleanup";
import { COMPLAINT_BUCKET, type ComplaintMedia, type ComplaintWithMedia, type SiteSettings } from "@/types/domain";
import ComplaintList, { type ComplaintMediaWithUrl } from "./ComplaintList";
import ComplaintExpirySettings from "./ComplaintExpirySettings";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour, regenerated on every page load

export default async function ComplaintsPage() {
  // No archive: anything past its expiration is deleted for good, right
  // here, before the list is even queried — so it's never possible to see
  // an expired complaint in the dashboard, even momentarily.
  await purgeExpiredComplaints();

  const supabase = await createClient();

  const [{ data: complaints }, { data: settings }] = await Promise.all([
    supabase
      .from("complaints")
      .select("*, complaint_media(*)")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }),
    supabase.from("site_settings").select("complaint_expiration_days").eq("id", "default").single(),
  ]);

  const typedComplaints = (complaints as ComplaintWithMedia[]) ?? [];

  // Private bucket: generate short-lived signed URLs for every attachment
  // up front so the client list component never needs its own Supabase
  // calls (and never sees anything but an admin-scoped, time-limited URL).
  const complaintsWithSignedMedia = await Promise.all(
    typedComplaints.map(async (complaint) => {
      const media: ComplaintMediaWithUrl[] = await Promise.all(
        complaint.complaint_media.map(async (m: ComplaintMedia) => {
          const { data } = await supabase.storage
            .from(COMPLAINT_BUCKET)
            .createSignedUrl(m.storage_path, SIGNED_URL_TTL_SECONDS);
          return { ...m, signedUrl: data?.signedUrl ?? null };
        })
      );
      return { ...complaint, complaint_media: media };
    })
  );

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-semibold text-saffron-600 mb-2">Complaints</p>
        <h1 className="font-display text-3xl text-navy-900">Active complaints</h1>
        <p className="text-sm text-ink-600 mt-1.5">
          Private to admins only &mdash; never exposed on the public site. Complaints are
          permanently deleted once they expire; there is no archive.
        </p>
      </div>

      <ComplaintExpirySettings
        currentDays={(settings as Pick<SiteSettings, "complaint_expiration_days"> | null)?.complaint_expiration_days ?? 7}
      />

      <ComplaintList complaints={complaintsWithSignedMedia} />
    </div>
  );
}
