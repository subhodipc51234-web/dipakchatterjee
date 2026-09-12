// app/admin/(protected)/phases/actions.ts
//
// CRUD for phases plus its inline photo gallery. Unlike features/posts,
// a phase's photos live directly on the row as a JSONB array
// (phases.photos) rather than a separate foreign-keyed media table, so
// adding/removing/reordering a photo is a read-modify-write of that one
// column instead of an insert/delete against a child table.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { PHASE_BUCKET, type PhasePhoto } from "@/types/domain";

export type PhaseFormInput = {
  title: string;
  period: string;
  summary: string;
  content: string;
};

export async function createPhase(input: PhaseFormInput) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase.from("phases").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("phases")
    .insert({
      title: input.title,
      period: input.period || null,
      summary: input.summary || null,
      content: input.content || null,
      sort_order: count ?? 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/phases");
  revalidatePath("/");
  revalidatePath("/phases");
  redirect(`/admin/phases/${data.id}`);
}

export async function updatePhase(id: string, input: PhaseFormInput) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("phases")
    .update({
      title: input.title,
      period: input.period || null,
      summary: input.summary || null,
      content: input.content || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/phases");
  revalidatePath(`/admin/phases/${id}`);
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function deletePhase(id: string) {
  const { supabase } = await requireAdmin();

  const { data: phase } = await supabase.from("phases").select("photos").eq("id", id).single();

  const photos = ((phase?.photos as PhasePhoto[] | null) ?? []).filter((p) => p.path);
  if (photos.length > 0) {
    await supabase.storage.from(PHASE_BUCKET).remove(photos.map((p) => p.path));
  }

  const { error } = await supabase.from("phases").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/phases");
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function reorderPhases(orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("phases").update({ sort_order: index }).eq("id", id)
    )
  );

  revalidatePath("/admin/phases");
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function togglePhasePinned(id: string, is_pinned: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("phases").update({ is_pinned }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/phases");
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function addPhasePhoto(
  phaseId: string,
  input: { url: string; path: string; caption?: string }
) {
  const { supabase } = await requireAdmin();

  const { data: phase, error: fetchError } = await supabase
    .from("phases")
    .select("photos")
    .eq("id", phaseId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const photos = (phase?.photos as PhasePhoto[] | null) ?? [];
  const next: PhasePhoto[] = [...photos, { url: input.url, path: input.path, caption: input.caption ?? "" }];

  const { error } = await supabase.from("phases").update({ photos: next }).eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/phases/${phaseId}`);
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function deletePhasePhoto(phaseId: string, path: string) {
  const { supabase } = await requireAdmin();

  const { data: phase, error: fetchError } = await supabase
    .from("phases")
    .select("photos")
    .eq("id", phaseId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const photos = (phase?.photos as PhasePhoto[] | null) ?? [];
  const next = photos.filter((p) => p.path !== path);

  const { error } = await supabase.from("phases").update({ photos: next }).eq("id", phaseId);
  if (error) throw new Error(error.message);

  await supabase.storage.from(PHASE_BUCKET).remove([path]);

  revalidatePath(`/admin/phases/${phaseId}`);
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function updatePhasePhotoCaption(phaseId: string, path: string, caption: string) {
  const { supabase } = await requireAdmin();

  const { data: phase, error: fetchError } = await supabase
    .from("phases")
    .select("photos")
    .eq("id", phaseId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const photos = (phase?.photos as PhasePhoto[] | null) ?? [];
  const next = photos.map((p) => (p.path === path ? { ...p, caption } : p));

  const { error } = await supabase.from("phases").update({ photos: next }).eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/phases/${phaseId}`);
  revalidatePath("/");
  revalidatePath("/phases");
}

export async function reorderPhasePhotos(phaseId: string, orderedPaths: string[]) {
  const { supabase } = await requireAdmin();

  const { data: phase, error: fetchError } = await supabase
    .from("phases")
    .select("photos")
    .eq("id", phaseId)
    .single();

  if (fetchError) throw new Error(fetchError.message);

  const photos = (phase?.photos as PhasePhoto[] | null) ?? [];
  const byPath = new Map(photos.map((p) => [p.path, p]));
  const next = orderedPaths.map((path) => byPath.get(path)).filter((p): p is PhasePhoto => Boolean(p));

  const { error } = await supabase.from("phases").update({ photos: next }).eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/phases/${phaseId}`);
  revalidatePath("/");
  revalidatePath("/phases");
}
