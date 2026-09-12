-- Fixes Settings -> Users & Access silently showing only the viewer's
-- own row: `profiles` has always had exactly one SELECT policy,
-- profiles_self_read ("auth.uid() = id"), and nothing granting a
-- broader read. The Users & Access panel fetches with the regular
-- per-request client (not the service-role client), so it was always
-- RLS-limited to a single row no matter who was viewing it or how many
-- profiles actually existed — confirmed live: even the ADMIN's own
-- session only ever saw count(*) = 1 against a 3-row table.
--
-- is_admin() already returns true for both ADMIN and MODERATOR (see
-- 20260915000000_moderator_role.sql), so this one additional policy is
-- exactly "privileged accounts can see the full user list" — RLS
-- policies are OR'd together, so a plain USER still only sees their own
-- row via profiles_self_read.
create policy "privileged can read all profiles"
  on public.profiles for select
  using (is_admin());
