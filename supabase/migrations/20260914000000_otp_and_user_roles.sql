-- Dual-channel login OTP verification, and the data model for
-- Settings -> Users & Access (profile email/phone/role, single-admin
-- enforcement).

-- Email/phone shown in the Users & Access panel, and the destination
-- for login OTP codes (see lib/otp.ts). Nullable: existing profiles
-- (created before this migration) have neither until an admin fills
-- them in — email is best-effort mirrored from auth.users at profile
-- creation time going forward (see app/admin/(protected)/settings/user-actions.ts).
alter table public.profiles
  add column if not exists email text,
  add column if not exists phone text;

-- Backfill from auth.users for every existing profile — without this,
-- the current admin's profiles.email stays null and the very first
-- login OTP after configuring an email/SMS provider would have nowhere
-- to send the email leg. New profiles created going forward populate
-- this themselves (see createUserAccount in user-actions.ts).
update public.profiles p
  set email = u.email
  from auth.users u
  where u.id = p.id and p.email is null;

-- `role` is a read-only view of `is_admin`, not a second flag to keep
-- in sync by hand — every existing RLS policy and requireAdmin() check
-- already keys off is_admin, so this only adds a friendlier label on
-- top without touching any of that.
alter table public.profiles
  add column if not exists role text generated always as (case when is_admin then 'ADMIN' else 'USER' end) stored;

-- Strictly one active ADMIN at a time. If more than one row currently
-- has is_admin = true (shouldn't happen, but defends the migration
-- against that state), keep only the most recently created one before
-- adding the constraint so this doesn't fail on existing data.
with ranked as (
  select id, row_number() over (order by created_at desc) as rn
  from public.profiles
  where is_admin
)
update public.profiles
  set is_admin = false
  where id in (select id from ranked where rn > 1);

-- Deferrable (not a plain unique index): transferring admin needs to
-- flip two rows — the old admin to false, the new admin to true — and
-- a plain unique index would reject the second UPDATE the instant it
-- runs, before the first UPDATE's effect is visible to it. Deferring
-- the check to transaction commit lets transfer_admin_role() (below)
-- perform both writes in one transaction and still have the invariant
-- enforced by the time anything else can observe the result.
create unique index if not exists profiles_single_admin_idx
  on public.profiles (is_admin)
  where is_admin;

alter table public.profiles
  add constraint profiles_single_admin_uq
  unique using index profiles_single_admin_idx
  deferrable initially immediate;

-- Atomically swaps the ADMIN role from whoever currently holds it to
-- `new_admin_id`. SECURITY DEFINER so it can perform both writes even
-- though the single-admin constraint would otherwise reject either one
-- in isolation; the actual authorization check (is the caller really
-- the current admin, did they confirm their password) happens in the
-- calling Server Action before this ever runs — see
-- app/admin/(protected)/settings/user-actions.ts.
create or replace function public.transfer_admin_role(new_admin_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  set constraints public.profiles_single_admin_uq deferred;

  update public.profiles set is_admin = false where is_admin = true;
  update public.profiles set is_admin = true where id = new_admin_id;

  if not found then
    raise exception 'Target user % does not exist', new_admin_id;
  end if;
end;
$$;

-- service_role ONLY — never `authenticated`. This function is
-- SECURITY DEFINER and bypasses the single-admin constraint by design,
-- so it must only ever be reachable from the service-role client on
-- the server, after the caller's identity and password have already
-- been verified in the Server Action. Granting it to `authenticated`
-- would let any logged-in USER call it directly via the Supabase
-- client SDK and make themselves ADMIN.
revoke all on function public.transfer_admin_role(uuid) from public, authenticated, anon;
grant execute on function public.transfer_admin_role(uuid) to service_role;

-- Login OTP codes: never store the raw 6-digit code, only an HMAC hash
-- (see lib/otp.ts, keyed by APP_ENCRYPTION_KEY) plus a short expiry and
-- an attempts counter for rate limiting. Row is deleted/consumed once
-- verified or expired; nothing here is ever exposed to a client.
create table public.admin_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index admin_otp_codes_user_id_idx on public.admin_otp_codes (user_id);

alter table public.admin_otp_codes enable row level security;

-- No client-facing policies at all: every read/write to this table
-- happens exclusively through Server Actions using the service-role
-- client (see utils/supabase/admin.ts), the same pattern already used
-- for public complaint submission.
