// app/admin/(protected)/settings/user-actions.ts
//
// Settings -> Users & Access. Every mutation here is admin-only
// (requireAdmin()) and every destructive/privilege-changing one also
// re-checks the current admin's password against Supabase Auth
// directly — a compromised or left-open dashboard session alone isn't
// enough to delete a user or transfer the ADMIN role.

"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireAdmin } from "@/lib/admin-guard";
import { createServiceClient } from "@/utils/supabase/admin";

/**
 * Re-checks a password against Supabase Auth for the currently signed-in
 * admin, without touching the real session. Uses a throwaway client
 * (anon key, no session persistence) so this can never overwrite or
 * extend the admin's actual cookies.
 */
async function verifyCurrentAdminPassword(adminEmail: string, password: string): Promise<boolean> {
  const throwaway = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await throwaway.auth.signInWithPassword({ email: adminEmail, password });
  return !error;
}

export type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

export async function createUserAccount(input: CreateUserInput) {
  await requireAdmin();

  const name = input.name.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (!name) throw new Error("Name is required.");
  if (!email) throw new Error("Email is required.");
  if (input.password.length < 8) throw new Error("Password must be at least 8 characters.");

  const service = createServiceClient();

  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
  });

  if (createError) throw new Error(createError.message);

  const { error: profileError } = await service.from("profiles").insert({
    id: created.user.id,
    full_name: name,
    email,
    phone: phone || null,
    is_admin: false,
  });

  if (profileError) {
    // Roll back the auth user so a failed profile insert doesn't leave
    // an orphaned account nobody can see or manage.
    await service.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/settings");
}

export async function deleteUserAccount(targetUserId: string, adminPassword: string) {
  const { supabase } = await requireAdmin();

  const { data: target } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", targetUserId)
    .single();

  if (!target) throw new Error("User not found.");
  // Belt-and-suspenders: the UI never renders a delete action for the
  // admin's own row, but this is the actual security boundary.
  if (target.is_admin) throw new Error("The primary admin account cannot be deleted.");

  const { data: adminAuth } = await supabase.auth.getUser();
  if (!adminAuth.user?.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyCurrentAdminPassword(adminAuth.user.email, adminPassword);
  if (!passwordOk) throw new Error("Incorrect password.");

  const service = createServiceClient();
  await service.from("profiles").delete().eq("id", targetUserId);
  const { error } = await service.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}

/**
 * Lets the current admin set the phone number login OTP codes are
 * texted to (their profiles.email is already backfilled from Supabase
 * Auth by the migration, but nothing populates a phone number
 * automatically). Deliberately admin-only and self-only, not a general
 * profile editor.
 */
export async function updateOwnContactPhone(phone: string) {
  const { user } = await requireAdmin();

  // Service client, not the request-bound one: profiles has no
  // client-facing "update your own row" RLS policy (every existing
  // policy on it is scoped through is_admin() for admin-only writes to
  // *other* tables), so this write would otherwise be silently
  // rejected by RLS.
  const service = createServiceClient();
  const { error } = await service.from("profiles").update({ phone: phone.trim() || null }).eq("id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}

export async function transferAdminRole(targetUserId: string, adminPassword: string) {
  const { supabase } = await requireAdmin();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("id", targetUserId)
    .single();

  if (!target) throw new Error("User not found.");
  if (target.is_admin) throw new Error("That user is already the admin.");

  const { data: adminAuth } = await supabase.auth.getUser();
  if (!adminAuth.user?.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyCurrentAdminPassword(adminAuth.user.email, adminPassword);
  if (!passwordOk) throw new Error("Incorrect password.");

  const service = createServiceClient();
  const { error } = await service.rpc("transfer_admin_role", { new_admin_id: targetUserId });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/settings");
}
