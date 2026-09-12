// app/admin/(protected)/settings/user-actions.ts
//
// Settings -> Users & Access. Only two actions are owner-only
// (requireOwner() — the single ADMIN): deleting a user and transferring
// the ADMIN role. Creating a user is requireAdmin(), which any USER also
// passes — matches "USER can create/add new users but cannot delete
// any account or transfer admin status". updateContactInfo uses
// requireProfile() since any USER needs to be able to edit their own
// contact details too — see its own comment for exactly which changes
// require a password.

"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { requireAdmin, requireOwner, requireProfile } from "@/lib/admin-guard";
import { logDashboardActivity } from "@/lib/activity-log";
import { createServiceClient } from "@/utils/supabase/admin";

/**
 * Re-checks a password against Supabase Auth for the given account,
 * without touching the real session. Uses a throwaway client (anon key,
 * no session persistence) so this can never overwrite or extend the
 * caller's actual cookies.
 */
async function verifyPassword(email: string, password: string): Promise<boolean> {
  const throwaway = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await throwaway.auth.signInWithPassword({ email, password });
  return !error;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Strips formatting and an optional country/trunk prefix down to a bare 10-digit number, or null if that's not possible. */
function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^\d{10}$/.test(digits) ? digits : null;
}

export type CreateUserInput = {
  name: string;
  email: string;
  phone: string;
  password: string;
};

/** Any logged-in profile (ADMIN or USER) may add a new user — always created as a standard USER; only transferAdminRole can ever produce a second privileged account. */
export async function createUserAccount(input: CreateUserInput) {
  const { supabase, user: caller } = await requireAdmin();

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

  // A pre-existing DB trigger (handle_new_user(), not part of this
  // migration history) already inserts a bare (id, full_name) profiles
  // row the instant createUser() above succeeds — a plain .insert()
  // here always collided with it (profiles_pkey violation) rather than
  // sometimes, since the trigger runs synchronously as part of the
  // auth.users insert. upsert() fills in the real name/email/phone
  // over whatever the trigger guessed, in the same single round trip.
  // is_admin: false is safe to upsert unconditionally — created.user.id
  // is a UUID Supabase just generated for a brand-new auth user, so it
  // can never collide with the existing admin's row.
  const { error: profileError } = await service.from("profiles").upsert(
    {
      id: created.user.id,
      full_name: name,
      email,
      phone: phone || null,
      is_admin: false,
    },
    { onConflict: "id" }
  );

  if (profileError) {
    // Roll back the auth user so a failed profile insert doesn't leave
    // an orphaned account nobody can see or manage.
    await service.auth.admin.deleteUser(created.user.id);
    throw new Error(profileError.message);
  }

  await logDashboardActivity(supabase, caller, {
    action: "CREATE_USER",
    entityType: "users",
    entityId: created.user.id,
    details: `Created user account: ${email}`,
  });

  revalidatePath("/admin/settings");
}

export async function deleteUserAccount(targetUserId: string, adminPassword: string) {
  const { supabase, user: caller } = await requireOwner();

  const { data: target } = await supabase
    .from("profiles")
    .select("is_admin, email")
    .eq("id", targetUserId)
    .single();

  if (!target) throw new Error("User not found.");
  // Belt-and-suspenders: the UI never renders a delete action for the
  // admin's own row, but this is the actual security boundary.
  if (target.is_admin) throw new Error("The primary admin account cannot be deleted.");

  const { data: adminAuth } = await supabase.auth.getUser();
  if (!adminAuth.user?.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyPassword(adminAuth.user.email, adminPassword);
  if (!passwordOk) throw new Error("Incorrect password.");

  const service = createServiceClient();
  await service.from("profiles").delete().eq("id", targetUserId);
  const { error } = await service.auth.admin.deleteUser(targetUserId);
  if (error) throw new Error(error.message);

  await logDashboardActivity(supabase, caller, {
    action: "DELETE_USER",
    entityType: "users",
    entityId: targetUserId,
    details: `Deleted user account: ${target.email ?? targetUserId}`,
  });

  revalidatePath("/admin/settings");
}

export type UpdateContactInfoInput = {
  targetUserId: string;
  email: string;
  phone: string;
  /**
   * Required when the change needs re-authentication: any email change
   * (it's a login credential), or an admin editing someone else's row
   * (a privileged action). A plain USER editing only their own phone
   * number can omit it.
   */
  confirmPassword?: string;
};

/**
 * Settings -> Users & Access (admin editing any row) and the dashboard
 * overview's "Your contact info" card (self-service) both call this.
 * Syncs profiles.email/phone (the app's own source of truth — login OTP
 * dispatch reads profiles.phone directly) and best-effort mirrors both
 * into Supabase Auth via updateUserById, so the login email and any
 * future phone-based auth stay aligned.
 */
export async function updateContactInfo(input: UpdateContactInfoInput) {
  const { user, profile: callerProfile } = await requireProfile();

  const isSelf = input.targetUserId === user.id;
  if (!isSelf && !callerProfile.is_admin) {
    throw new Error("You can only edit your own contact details.");
  }

  const email = input.email.trim();
  const rawPhone = input.phone.trim();

  if (!isValidEmail(email)) throw new Error("Enter a valid email address.");
  const normalizedPhone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !normalizedPhone) throw new Error("Enter a valid 10-digit phone number.");

  const service = createServiceClient();

  const { data: target } = await service.from("profiles").select("email").eq("id", input.targetUserId).single();
  if (!target) throw new Error("User not found.");

  const emailChanged = email !== (target.email ?? "");
  const editingSomeoneElseAsAdmin = !isSelf && callerProfile.is_admin;

  if (emailChanged || editingSomeoneElseAsAdmin) {
    if (!callerProfile.email) throw new Error("Could not verify your account.");
    if (!input.confirmPassword) throw new Error("Your password is required to confirm this change.");

    const passwordOk = await verifyPassword(callerProfile.email, input.confirmPassword);
    if (!passwordOk) throw new Error("Incorrect password.");
  }

  if (emailChanged) {
    const { error: authEmailError } = await service.auth.admin.updateUserById(input.targetUserId, {
      email,
      email_confirm: true,
    });
    if (authEmailError) throw new Error(authEmailError.message);
  }

  if (normalizedPhone) {
    // Best-effort only: Supabase Auth's phone field has its own format
    // rules and this app doesn't use phone-based auth, so a rejection
    // here shouldn't block the profiles update — profiles.phone is what
    // login OTP dispatch actually reads (see lib/otp-login.ts). Assumes
    // an Indian number (+91) by default, matching the site's context.
    const { error: authPhoneError } = await service.auth.admin.updateUserById(input.targetUserId, {
      phone: `+91${normalizedPhone}`,
    });
    if (authPhoneError) {
      console.warn("[user-actions] Supabase Auth phone sync failed:", authPhoneError.message);
    }
  }

  const { error: profileError } = await service
    .from("profiles")
    .update({ email, phone: normalizedPhone })
    .eq("id", input.targetUserId);
  if (profileError) throw new Error(profileError.message);

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function transferAdminRole(targetUserId: string, adminPassword: string) {
  const { supabase, user: caller } = await requireOwner();

  const { data: target } = await supabase
    .from("profiles")
    .select("id, is_admin, email")
    .eq("id", targetUserId)
    .single();

  if (!target) throw new Error("User not found.");
  if (target.is_admin) throw new Error("That user is already the admin.");

  const { data: adminAuth } = await supabase.auth.getUser();
  if (!adminAuth.user?.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyPassword(adminAuth.user.email, adminPassword);
  if (!passwordOk) throw new Error("Incorrect password.");

  const service = createServiceClient();
  const { error } = await service.rpc("transfer_admin_role", { new_admin_id: targetUserId });
  if (error) throw new Error(error.message);

  await logDashboardActivity(supabase, caller, {
    action: "UPDATE_USER_ROLE",
    entityType: "users",
    entityId: targetUserId,
    details: `Transferred admin role to: ${target.email ?? targetUserId}`,
  });

  revalidatePath("/admin/settings");
}

/**
 * Self-service password change — any recognized profile, own account
 * only. Re-verifies currentPassword the same way deleteUserAccount/
 * transferAdminRole re-verify an admin's password (a fresh
 * signInWithPassword against a throwaway client, never trusting the
 * client to have checked it), then applies the change through the
 * request's own session-bound client — updateUser() always targets
 * "whoever this session belongs to", so there's no target-user id to
 * get wrong here.
 */
export async function changeOwnPassword(currentPassword: string, newPassword: string) {
  const { supabase, user } = await requireAdmin();

  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  if (!user.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyPassword(user.email, currentPassword);
  if (!passwordOk) throw new Error("Current password is incorrect.");

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
}

/**
 * Admin override — resets a *different* user's password. Owner-only
 * (requireOwner(), same as deleteUserAccount/transferAdminRole), and
 * verifies the caller's own password before touching anything, exactly
 * like those two. The actual write goes through the service-role
 * client's admin API (updateUserById), since the admin has no session
 * to run a plain updateUser() against on the target's behalf.
 */
export async function adminResetPassword(targetUserId: string, adminPassword: string, newPassword: string) {
  const { supabase, user } = await requireOwner();

  if (newPassword.length < 8) throw new Error("New password must be at least 8 characters.");
  if (targetUserId === user.id) throw new Error("Use Change Password to update your own password.");

  const { data: target } = await supabase.from("profiles").select("id").eq("id", targetUserId).single();
  if (!target) throw new Error("User not found.");

  const { data: adminAuth } = await supabase.auth.getUser();
  if (!adminAuth.user?.email) throw new Error("Could not verify your account.");

  const passwordOk = await verifyPassword(adminAuth.user.email, adminPassword);
  if (!passwordOk) throw new Error("Incorrect password.");

  const service = createServiceClient();
  const { error } = await service.auth.admin.updateUserById(targetUserId, { password: newPassword });
  if (error) throw new Error(error.message);
}
