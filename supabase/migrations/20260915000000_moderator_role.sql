-- Adds a second privileged role, MODERATOR: any number of accounts may
-- hold it (unlike ADMIN, which stays capped at exactly one — see the
-- profiles_single_admin_uq constraint from the previous migration,
-- left untouched here). MODERATOR gets the same content/settings edit
-- rights as ADMIN; only ADMIN gets user-management rights (add/delete/
-- edit users, change roles, transfer the ADMIN role itself) — that
-- distinction is enforced in the app layer (see requireAdmin() vs the
-- new requireOwner() in lib/admin-guard.ts), not here.

alter table public.profiles
  add column if not exists is_moderator boolean not null default false;

-- `role` is a generated display label — was ADMIN/USER derived from
-- is_admin alone; now also reports MODERATOR. Generated columns can't
-- be altered in place, so this drops and re-adds it with the new
-- expression.
alter table public.profiles drop column if exists role;

alter table public.profiles
  add column role text generated always as (
    case
      when is_admin then 'ADMIN'
      when is_moderator then 'MODERATOR'
      else 'USER'
    end
  ) stored;

-- is_admin() is called from every content/settings RLS policy in this
-- project (site_settings, features, posts, organizations, complaints,
-- nav/header/footer/social config, storage buckets — see every prior
-- migration's `using (is_admin())` / `with check (is_admin())`).
-- Broadening what it returns — rather than renaming it and touching
-- every one of those policies — is what grants MODERATOR the same
-- content/settings edit access as ADMIN with no other change needed.
-- The name is now a slight misnomer (it really means "can edit site
-- content"); that's a deliberate, documented trade-off against a much
-- larger, riskier migration.
--
-- The raw `is_admin` column keeps its original, narrower meaning
-- everywhere else (the literal single ADMIN account) — lib/admin-guard.ts's
-- requireOwner() and every user-management Server Action key off that
-- column directly, not this function, so moderators never gain
-- user-management access through this change.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and (is_admin = true or is_moderator = true)
  );
$$;
