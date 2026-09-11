// app/admin/(protected)/features/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { FEATURE_BUCKET, type FeatureType, type MediaKind } from "@/types/domain";

export type FeatureFormInput = {
  title: string;
  subtitle: string;
  body_markdown: string;
  type: FeatureType;
  is_published: boolean;
};

export async function createFeature(input: FeatureFormInput) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("features")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("features")
    .insert({
      title: input.title,
      subtitle: input.subtitle || null,
      body_markdown: input.body_markdown || null,
      type: input.type,
      is_published: input.is_published,
      display_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  revalidatePath("/");
  redirect(`/admin/features/${data.id}`);
}

export async function updateFeature(id: string, input: FeatureFormInput) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("features")
    .update({
      title: input.title,
      subtitle: input.subtitle || null,
      body_markdown: input.body_markdown || null,
      type: input.type,
      is_published: input.is_published,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  revalidatePath(`/admin/features/${id}`);
  revalidatePath("/");
}

export async function deleteFeature(id: string) {
  const { supabase } = await requireAdmin();

  const { data: media } = await supabase
    .from("feature_media")
    .select("storage_path")
    .eq("feature_id", id);

  if (media && media.length > 0) {
    await supabase.storage
      .from(FEATURE_BUCKET)
      .remove(media.map((m) => m.storage_path));
  }

  const { error } = await supabase.from("features").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  revalidatePath("/");
}

export async function reorderFeatures(orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("features").update({ display_order: index }).eq("id", id)
    )
  );

  revalidatePath("/admin/features");
  revalidatePath("/");
}

export async function toggleFeaturePublished(id: string, is_published: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("features")
    .update({ is_published })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  revalidatePath("/");
}

export async function addFeatureMedia(
  featureId: string,
  input: { kind: MediaKind; storage_path: string; public_url: string; caption?: string }
) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("feature_media")
    .select("*", { count: "exact", head: true })
    .eq("feature_id", featureId);

  const { error } = await supabase.from("feature_media").insert({
    feature_id: featureId,
    kind: input.kind,
    storage_path: input.storage_path,
    public_url: input.public_url,
    caption: input.caption || null,
    display_order: count ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/features/${featureId}`);
  revalidatePath("/");
}

export async function deleteFeatureMedia(featureId: string, mediaId: string) {
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from("feature_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();

  if (row) {
    await supabase.storage.from(FEATURE_BUCKET).remove([row.storage_path]);
  }

  const { error } = await supabase.from("feature_media").delete().eq("id", mediaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/features/${featureId}`);
  revalidatePath("/");
}

export async function updateFeatureMediaMeta(
  featureId: string,
  mediaId: string,
  input: { title?: string; caption?: string }
) {
  const { supabase } = await requireAdmin();

  const patch: { title?: string | null; caption?: string | null } = {};
  if (input.title !== undefined) patch.title = input.title || null;
  if (input.caption !== undefined) patch.caption = input.caption || null;

  const { error } = await supabase.from("feature_media").update(patch).eq("id", mediaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/features/${featureId}`);
  revalidatePath("/");
}

// Global, not per-feature — there's one public hero/banner gallery — but
// lives beside the Image Gallery feature's media manager since that's
// the only place an admin would look for "how fast does it cycle".
export async function updateGalleryIntervalSeconds(seconds: number) {
  const { supabase } = await requireAdmin();

  const clamped = Math.min(60, Math.max(1, Math.round(seconds)));

  const { error } = await supabase
    .from("site_settings")
    .update({ gallery_interval_ms: clamped * 1000, updated_at: new Date().toISOString() })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/features");
  revalidatePath("/");
}

export async function reorderFeatureMedia(featureId: string, orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("feature_media").update({ display_order: index }).eq("id", id)
    )
  );

  revalidatePath(`/admin/features/${featureId}`);
  revalidatePath("/");
}
