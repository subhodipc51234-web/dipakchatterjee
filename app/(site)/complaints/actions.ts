// app/(site)/complaints/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createServiceClient } from "@/utils/supabase/admin";
import { COMPLAINT_BUCKET } from "@/types/domain";
import { checkRateLimit } from "@/lib/rate-limit";
import { sniffMediaKind } from "@/lib/file-validation";

const MAX_FILES = 5;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

// Public, unauthenticated endpoint — a low, honest cap against spam
// (see lib/rate-limit.ts for the single-instance-only caveat).
const RATE_LIMIT_MAX_SUBMISSIONS = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const complaintSchema = z.object({
  description: z.string().trim().min(20, "Please provide at least 20 characters").max(5000),
  contact_phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || v.length >= 6, "Enter a valid phone number, or leave it blank"),
});

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
}

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  const forwardedFor = hdrs.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return hdrs.get("x-real-ip") ?? "unknown";
}

export type SubmitComplaintResult =
  | { success: true; referenceId: string }
  | { success: false; error: string; fieldErrors?: Record<string, string> };

export async function submitComplaint(formData: FormData): Promise<SubmitComplaintResult> {
  const ip = await getClientIp();
  if (!checkRateLimit(`complaint:${ip}`, RATE_LIMIT_MAX_SUBMISSIONS, RATE_LIMIT_WINDOW_MS)) {
    return {
      success: false,
      error: "Too many complaints submitted from this connection recently. Please try again later.",
    };
  }

  const parsed = complaintSchema.safeParse({
    description: formData.get("description"),
    contact_phone: formData.get("contact_phone"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: "Please check the form and try again.", fieldErrors };
  }

  const supabase = createServiceClient();

  const { data: settings } = await supabase
    .from("site_settings")
    .select("complaint_expiration_days")
    .eq("id", "default")
    .single();

  const days = settings?.complaint_expiration_days ?? 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

  const { data: complaint, error } = await supabase
    .from("complaints")
    .insert({
      description: parsed.data.description,
      contact_phone: parsed.data.contact_phone || null,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !complaint) {
    return { success: false, error: "Something went wrong submitting your complaint. Please try again." };
  }

  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0)
    .slice(0, MAX_FILES);

  for (const [i, file] of files.entries()) {
    const declaredIsVideo = file.type.startsWith("video/");
    const declaredIsImage = file.type.startsWith("image/");
    if (!declaredIsImage && !declaredIsVideo) continue;
    if (file.size > (declaredIsVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) continue;

    // Never trust the declared MIME type alone — it's just whatever
    // Content-Type the uploading client claimed. Confirm what the file
    // actually is from its leading bytes, and reject anything that
    // doesn't genuinely match a real image/video format (this is also
    // what stops an SVG — which can carry a <script> payload — from
    // being smuggled in disguised as a JPEG).
    const sniffed = await sniffMediaKind(file);
    if (!sniffed) continue;
    if ((sniffed === "video") !== declaredIsVideo) continue;

    const isVideo = sniffed === "video";
    const path = `${complaint.id}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from(COMPLAINT_BUCKET)
      .upload(path, file, { contentType: file.type });

    if (!uploadError) {
      await supabase.from("complaint_media").insert({
        complaint_id: complaint.id,
        kind: isVideo ? "video" : "image",
        storage_path: path,
        display_order: i,
      });
    }
  }

  revalidatePath("/admin/complaints");

  return { success: true, referenceId: complaint.id };
}
