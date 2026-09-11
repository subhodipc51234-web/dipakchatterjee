// app/admin/(protected)/posts/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";
import { POST_BUCKET, type MediaKind } from "@/types/domain";

export type PostFormInput = {
  title: string;
  body: string;
  /** "YYYY-MM-DDTHH:mm" from a datetime-local input, in the admin's local time; empty to fall back to now(). */
  published_at: string;
  external_link: string;
  is_published: boolean;
};

export async function createPost(input: PostFormInput) {
  const { supabase, user } = await requireAdmin();

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title: input.title || null,
      body: input.body || null,
      // Omitted (not just null) so the column's `default now()` applies
      // when the admin leaves the picker untouched/cleared.
      ...(input.published_at ? { published_at: new Date(input.published_at).toISOString() } : {}),
      external_link: input.external_link || null,
      is_published: input.is_published,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/");
  redirect(`/admin/posts/${data.id}`);
}

export async function updatePost(id: string, input: PostFormInput) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("posts")
    .update({
      title: input.title || null,
      body: input.body || null,
      ...(input.published_at ? { published_at: new Date(input.published_at).toISOString() } : {}),
      external_link: input.external_link || null,
      is_published: input.is_published,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${id}`);
  revalidatePath("/");
}

export async function deletePost(id: string) {
  const { supabase } = await requireAdmin();

  const { data: media } = await supabase
    .from("post_media")
    .select("storage_path")
    .eq("post_id", id);

  if (media && media.length > 0) {
    await supabase.storage
      .from(POST_BUCKET)
      .remove(media.map((m) => m.storage_path));
  }

  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function togglePostPublished(id: string, is_published: boolean) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("posts")
    .update({ is_published })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/posts");
  revalidatePath("/");
}

export async function addPostMedia(
  postId: string,
  input: { kind: MediaKind; storage_path: string; public_url: string }
) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("post_media")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);

  const { error } = await supabase.from("post_media").insert({
    post_id: postId,
    kind: input.kind,
    storage_path: input.storage_path,
    public_url: input.public_url,
    display_order: count ?? 0,
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath("/");
}

export async function deletePostMedia(postId: string, mediaId: string) {
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from("post_media")
    .select("storage_path")
    .eq("id", mediaId)
    .single();

  if (row) {
    await supabase.storage.from(POST_BUCKET).remove([row.storage_path]);
  }

  const { error } = await supabase.from("post_media").delete().eq("id", mediaId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath("/");
}

export async function reorderPostMedia(postId: string, orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("post_media").update({ display_order: index }).eq("id", id)
    )
  );

  revalidatePath(`/admin/posts/${postId}`);
  revalidatePath("/");
}
