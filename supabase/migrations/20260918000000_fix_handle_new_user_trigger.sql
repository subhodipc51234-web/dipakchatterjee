-- Fixes handle_new_user() (the on_auth_user_created trigger), which is
-- not part of this migration history — it predates it, was presumably
-- edited by hand in the Supabase SQL editor at some point, and had
-- drifted into a broken state that made every single new signup fail
-- with GoTrue's generic "Database error creating new user":
--
--   insert into public.profiles (id, email, role, updated_at)
--   values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'USER'), now())
--   on conflict (id) do update set email = excluded.email, updated_at = now();
--
-- Two independent fatal errors in that body, either one enough to fail
-- every insert on its own:
--   1. `role` is a STORED GENERATED column (case when is_admin then
--      'ADMIN' else 'USER' end) — Postgres always rejects writing to a
--      generated column directly, regardless of the value supplied.
--   2. `updated_at` does not exist on public.profiles at all.
--
-- Restored to a minimal, correct version: only real, writable columns.
-- is_admin is intentionally omitted so its column default (false, see
-- 20260915010000_fix_is_admin_default.sql) applies — every new signup
-- is a standard USER unless explicitly promoted afterward (transfer,
-- never at creation time). full_name is left for the caller to fill in
-- (createUserAccount's own upsert immediately follows this trigger and
-- sets it) rather than guessed from auth metadata here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;
