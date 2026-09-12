-- Collapses the three-tier ADMIN/MODERATOR/USER model back to two tiers:
-- ADMIN (still exactly one, still the only one who can delete a user or
-- transfer the ADMIN role) and USER (everyone else — now with full
-- content/settings edit access AND the ability to add new users; the
-- MODERATOR tier this replaces already had the former, and USER gains
-- both).
--
-- MODERATOR is gone outright rather than folded into USER by name only
-- — is_moderator is dropped, not just ignored, so there's no lingering
-- column a future change could accidentally start reading again.
-- Drop the dependent generated column first — Postgres won't drop
-- is_moderator while `role`'s generation expression still reads it.
alter table public.profiles drop column if exists role;
alter table public.profiles drop column if exists is_moderator;

alter table public.profiles
  add column role text generated always as (case when is_admin then 'ADMIN' else 'USER' end) stored;

-- is_admin() is called from every content/settings RLS policy in this
-- project (see the comment in 20260915000000_moderator_role.sql for the
-- full list) and from lib/admin-guard.ts's requireAdmin(). Broadening it
-- to "is any recognized profile" — rather than "is_admin OR
-- is_moderator", which no longer means anything now that is_moderator
-- is gone — is what gives USER the same full content/settings access
-- ADMIN has, with no per-policy changes needed. The literal single
-- ADMIN (delete a user, transfer the ADMIN role) is still gated
-- separately by lib/admin-guard.ts's requireOwner(), which reads the
-- raw is_admin column directly rather than calling this function.
create or replace function public.is_admin()
returns boolean
language sql
stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
  );
$$;
