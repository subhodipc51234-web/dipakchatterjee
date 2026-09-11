// app/admin/(protected)/settings/header-actions.ts
//
// Server Actions for the dynamic header action buttons/links (the
// header builder — see components/site/SiteHeader.tsx for how these
// render). Split out from actions.ts to keep it alongside the other
// dedicated builder files (footer-actions.ts).

"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import type { HeaderActionIcon, HeaderActionPosition, HeaderActionStyle } from "@/types/domain";

export async function createHeaderAction(input: {
  label?: string;
  url: string;
  icon?: HeaderActionIcon;
  style?: HeaderActionStyle;
  position?: HeaderActionPosition;
  bg_color?: string | null;
  text_color?: string | null;
}) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase.from("header_actions").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("header_actions")
    .insert({
      label: input.label ?? "",
      url: input.url,
      icon: input.icon ?? "none",
      style: input.style ?? "solid",
      position: input.position ?? "right",
      bg_color: input.bg_color ?? null,
      text_color: input.text_color ?? null,
      display_order: count ?? 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");

  return data;
}

export async function updateHeaderAction(
  id: string,
  input: {
    label?: string;
    url?: string;
    icon?: HeaderActionIcon;
    style?: HeaderActionStyle;
    position?: HeaderActionPosition;
    bg_color?: string | null;
    text_color?: string | null;
  }
) {
  const { supabase } = await requireAdmin();

  const patch: {
    label?: string;
    url?: string;
    icon?: HeaderActionIcon;
    style?: HeaderActionStyle;
    position?: HeaderActionPosition;
    bg_color?: string | null;
    text_color?: string | null;
  } = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.url !== undefined) patch.url = input.url;
  if (input.icon !== undefined) patch.icon = input.icon;
  if (input.style !== undefined) patch.style = input.style;
  if (input.position !== undefined) patch.position = input.position;
  if (input.bg_color !== undefined) patch.bg_color = input.bg_color;
  if (input.text_color !== undefined) patch.text_color = input.text_color;

  const { error } = await supabase.from("header_actions").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function deleteHeaderAction(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("header_actions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function reorderHeaderActions(orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) => supabase.from("header_actions").update({ display_order: index }).eq("id", id))
  );

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
