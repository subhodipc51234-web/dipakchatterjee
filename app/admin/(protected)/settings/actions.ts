// app/admin/(protected)/settings/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-guard";
import { SITE_BUCKET } from "@/types/domain";

type ImageKind = "hero" | "avatar";

export async function updateSiteImage(
  kind: ImageKind,
  input: { storage_path: string; public_url: string }
) {
  const { supabase } = await requireAdmin();

  const { data: current } = await supabase
    .from("site_settings")
    .select("hero_image_path, avatar_path")
    .eq("id", "default")
    .single();

  const oldPath = kind === "hero" ? current?.hero_image_path : current?.avatar_path;

  const patch =
    kind === "hero"
      ? { hero_image_url: input.public_url, hero_image_path: input.storage_path }
      : { avatar_url: input.public_url, avatar_path: input.storage_path };

  const { error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  if (oldPath) {
    await supabase.storage.from(SITE_BUCKET).remove([oldPath]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export type LandingContentInput = {
  hero_headline: string;
  hero_body: string;
};

export async function updateLandingContent(input: LandingContentInput) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("site_settings")
    .update({
      hero_headline: input.hero_headline || null,
      hero_body: input.hero_body || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export type BrandingTextInput = {
  header_name: string;
  header_subtitle: string;
  footer_tagline: string;
  footer_copyright_name: string;
  footer_note: string;
  office_email: string;
};

export async function updateBrandingText(input: BrandingTextInput) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("site_settings")
    .update({
      header_name: input.header_name || null,
      header_subtitle: input.header_subtitle || null,
      footer_tagline: input.footer_tagline || null,
      footer_copyright_name: input.footer_copyright_name || null,
      footer_note: input.footer_note || null,
      office_email: input.office_email || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}

export async function createOrganization(input: {
  name: string;
  logo_url: string;
  logo_path: string;
  external_url?: string;
  designation?: string;
}) {
  const { supabase } = await requireAdmin();

  const { count } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      logo_url: input.logo_url,
      logo_path: input.logo_path,
      external_url: input.external_url || null,
      designation: input.designation || null,
      display_order: count ?? 0,
    })
    .select("id, display_order, created_at")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");

  return data;
}

export async function updateOrganization(
  id: string,
  input: { name?: string; external_url?: string; designation?: string }
) {
  const { supabase } = await requireAdmin();

  const patch: { name?: string; external_url?: string | null; designation?: string | null } = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.external_url !== undefined) patch.external_url = input.external_url || null;
  if (input.designation !== undefined) patch.designation = input.designation || null;

  const { error } = await supabase.from("organizations").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function replaceOrganizationLogo(
  id: string,
  input: { logo_url: string; logo_path: string }
) {
  const { supabase } = await requireAdmin();

  const { data: current } = await supabase
    .from("organizations")
    .select("logo_path")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("organizations")
    .update({ logo_url: input.logo_url, logo_path: input.logo_path })
    .eq("id", id);

  if (error) throw new Error(error.message);

  if (current?.logo_path) {
    await supabase.storage.from(SITE_BUCKET).remove([current.logo_path]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function deleteOrganization(id: string) {
  const { supabase } = await requireAdmin();

  const { data: current } = await supabase
    .from("organizations")
    .select("logo_path")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("organizations").delete().eq("id", id);
  if (error) throw new Error(error.message);

  if (current?.logo_path) {
    await supabase.storage.from(SITE_BUCKET).remove([current.logo_path]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function reorderOrganizations(orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("organizations").update({ display_order: index }).eq("id", id)
    )
  );

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function assertHexColor(value: string, label: string) {
  if (!HEX_COLOR_RE.test(value)) {
    throw new Error(`${label} must be a hex color like #C1832B.`);
  }
}

export async function updateThemeColors(input: {
  theme_primary_color: string;
  theme_secondary_color: string;
}) {
  const { supabase } = await requireAdmin();

  assertHexColor(input.theme_primary_color, "Main Theme Color");
  assertHexColor(input.theme_secondary_color, "Secondary Color");

  const { error } = await supabase
    .from("site_settings")
    .update({
      theme_primary_color: input.theme_primary_color,
      theme_secondary_color: input.theme_secondary_color,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function createCtaButton(input: { label: string; url: string; color?: string }) {
  const { supabase } = await requireAdmin();

  if (input.color) assertHexColor(input.color, "Button color");

  const { count } = await supabase.from("cta_buttons").select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("cta_buttons")
    .insert({
      label: input.label,
      url: input.url,
      color: input.color || null,
      display_order: count ?? 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");

  return data;
}

export async function updateCtaButton(
  id: string,
  input: { label?: string; url?: string; color?: string | null }
) {
  const { supabase } = await requireAdmin();

  const patch: { label?: string; url?: string; color?: string | null } = {};
  if (input.label !== undefined) patch.label = input.label;
  if (input.url !== undefined) patch.url = input.url;
  if (input.color !== undefined) {
    if (input.color) assertHexColor(input.color, "Button color");
    patch.color = input.color || null;
  }

  const { error } = await supabase.from("cta_buttons").update(patch).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function deleteCtaButton(id: string) {
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("cta_buttons").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function reorderCtaButtons(orderedIds: string[]) {
  const { supabase } = await requireAdmin();

  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("cta_buttons").update({ display_order: index }).eq("id", id)
    )
  );

  revalidatePath("/admin/settings");
  revalidatePath("/");
}

export async function removeSiteImage(kind: ImageKind) {
  const { supabase } = await requireAdmin();

  const { data: current } = await supabase
    .from("site_settings")
    .select("hero_image_path, avatar_path")
    .eq("id", "default")
    .single();

  const oldPath = kind === "hero" ? current?.hero_image_path : current?.avatar_path;

  const patch =
    kind === "hero"
      ? { hero_image_url: null, hero_image_path: null }
      : { avatar_url: null, avatar_path: null };

  const { error } = await supabase
    .from("site_settings")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", "default");

  if (error) throw new Error(error.message);

  if (oldPath) {
    await supabase.storage.from(SITE_BUCKET).remove([oldPath]);
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
}
