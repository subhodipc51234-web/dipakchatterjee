-- Security/RLS audit fix.
--
-- ROOT CAUSE (confirmed via live introspection of pg_policies / pg_proc
-- before writing this migration, not assumed): public.is_admin() was
-- defined as
--
--   select exists (select 1 from public.profiles where id = auth.uid())
--
-- and public.profiles had a SELECT policy ("privileged can read all
-- profiles") whose qual is literally `is_admin()`. That is a genuine
-- self-referential cycle: evaluating the profiles SELECT policy calls
-- is_admin(), which queries profiles, which (re-)evaluates the profiles
-- SELECT policy. It only failed to blow up in practice because
-- is_admin() is SECURITY DEFINER and Postgres exempts a table's owner
-- from its own RLS by default — i.e. it has been surviving on an
-- implicit, undocumented assumption (function owner == table owner ==
-- RLS-exempt), not on being actually non-recursive. Any change to who
-- owns these objects, or FORCE ROW LEVEL SECURITY ever being turned on,
-- reintroduces "infinite recursion detected in policy for relation
-- profiles" immediately. Every write policy on every other admin-gated
-- table (posts, phases, site_settings, features, organizations, ...)
-- also calls is_admin(), so this one function was a single point of
-- failure for the entire dashboard, not just profiles itself.
--
-- Fix: is_admin() no longer reads public.profiles at all. It reads a
-- new, dedicated public.admins table instead (decoupled, per this
-- migration's brief), OR-ed with a JWT app_metadata role claim for
-- defense in depth. Neither path can ever re-enter a profiles policy.

-- ---------------------------------------------------------------------
-- 1. Dedicated, decoupled admin-membership table.
--
-- Mirrors public.profiles 1:1 (this app's current model: every
-- recognized profile — ADMIN or USER — gets full dashboard/content
-- access; requireOwner()/profiles.is_admin remains the separate,
-- narrower "is the single owner account" check used for
-- delete-user/transfer-admin). RLS is enabled with NO policies at all,
-- so no client role (anon or authenticated) can read or write it
-- through the API under any circumstance — its only readers are
-- SECURITY DEFINER functions (which run as the table owner and are
-- therefore exempt from its RLS the same way is_admin() always assumed
-- for profiles, except here that assumption is actually safe: this
-- table has no policies that could ever call back into is_admin()).
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.admins enable row level security;

insert into public.admins (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

-- 2. Keep admins mirrored automatically from here on, regardless of
-- which code path inserts/deletes a profile (the handle_new_user()
-- trigger, createUserAccount's service-role upsert, deleteUserAccount's
-- delete, transferAdminRole, etc.) — so Step 3's "ensure a record
-- exists for every admin account" is structurally guaranteed instead of
-- a one-off backfill that can drift again later.
create or replace function public.sync_admins_from_profiles()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.admins (user_id) values (new.id)
    on conflict (user_id) do nothing;
  elsif tg_op = 'DELETE' then
    delete from public.admins where user_id = old.id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists profiles_sync_admins on public.profiles;
create trigger profiles_sync_admins
  after insert or delete on public.profiles
  for each row execute function public.sync_admins_from_profiles();

-- 3. Zero-recursion is_admin(): reads public.admins (never profiles),
-- OR a JWT app_metadata role claim — either path alone is sufficient,
-- so a gap in one (e.g. a claim that hasn't been refreshed into a live
-- session's JWT yet) doesn't lock anyone out while the other is intact.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    exists (select 1 from public.admins where user_id = auth.uid())
    or coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- 4. Drop and recreate every policy on profiles from scratch, per the
-- audit brief — even though only is_admin()'s body actually needed to
-- change (its call sites didn't), this leaves a clean, fully-audited
-- set of policies rather than one changed function underneath
-- unexamined old policy rows.
drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "privileged can read all profiles" on public.profiles;

-- SELECT is deliberately kept scoped (self row, or every row for a
-- recognized admin/user account) rather than opened to `true`/public.
-- profiles carries email and phone — real contact PII — and nothing
-- about fixing the recursion requires making that world-readable via
-- the public anon key; the recursion was in is_admin()'s
-- implementation, not in these policies' shape. Both quals below are
-- plain, non-nested expressions, so this is exactly as recursion-free
-- as a `true` policy would have been.
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_admin_read_all"
  on public.profiles for select
  using (is_admin());

-- INSERT/UPDATE: every current code path writes profiles through the
-- service-role client (see app/admin/(protected)/settings/user-actions.ts),
-- which bypasses RLS entirely, so these did not previously exist. Added
-- here per the audit brief for defense in depth / to support a future
-- direct client-side self-service edit. UPDATE intentionally does NOT
-- grant blanket column access: is_admin is a privilege flag, and a
-- naive `auth.uid() = id` policy with no column restriction would let
-- any authenticated USER self-promote via a direct REST call
-- (`update profiles set is_admin = true where id = auth.uid()`) even
-- though the UI never exposes that. Restricting the GRANT to the
-- specific columns a user may edit closes that hole independently of
-- RLS row-matching.
create policy "profiles_self_insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

revoke update on public.profiles from authenticated;
grant update (full_name, email, phone) on public.profiles to authenticated;

-- 5. Dependent tables (posts, phases, site_settings, features,
-- organizations, cta_buttons, footer_blocks/links, header_actions,
-- nav_links, social_links, complaints/complaint_media, post_media,
-- feature_media) were audited via a live pg_policies query: every
-- write policy across all of them already calls is_admin() with no
-- other reference to profiles, and every public SELECT policy is
-- either `true`, a plain column check (e.g. is_published = true), or
-- an EXISTS against its own parent table (post_media -> posts,
-- feature_media -> features) — never profiles. None of them need any
-- change; fixing is_admin() above fixes all of them transitively,
-- since it was the single shared point of failure. No further ALTER
-- statements follow for those tables.
