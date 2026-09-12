-- Rolling dashboard activity audit log: at most 20 rows, none older
-- than 24 hours, enforced by an AFTER INSERT trigger rather than left
-- to application code (so it holds even against a direct insert from
-- the SQL editor or a future code path that forgets to prune).
create table public.dashboard_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details text not null,
  created_at timestamptz not null default now()
);

alter table public.dashboard_activity_logs enable row level security;

-- Authenticated admin read/write only — never public. Uses the same
-- decoupled is_admin() introduced in the RLS recursion fix, which reads
-- public.admins (never profiles), so this carries zero recursion risk.
create policy "Admins can view activity logs"
  on public.dashboard_activity_logs for select
  to authenticated
  using (is_admin());

create policy "Admins can insert activity logs"
  on public.dashboard_activity_logs for insert
  to authenticated
  with check (is_admin());

create index if not exists dashboard_activity_logs_created_at_idx
  on public.dashboard_activity_logs (created_at desc);

-- Enforces both retention rules after every insert:
--   Rule A: drop anything older than 24 hours.
--   Rule B: of what remains, keep only the newest 20 rows.
-- SECURITY DEFINER is required here, not just hygiene: there is no
-- DELETE policy on this table (deliberately — admins should never be
-- able to erase audit history from the client), so a plain invoker-
-- rights trigger running as `authenticated` would have its prune
-- deletes silently filtered to zero rows by RLS. Running as the
-- (postgres-owned) function owner is what makes pruning actually work,
-- the same mechanism the profiles RLS fix relies on — safe here because
-- this function never reads/writes profiles, so it can't reintroduce
-- that recursion.
create or replace function public.prune_dashboard_activity_logs()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  delete from public.dashboard_activity_logs
  where created_at < now() - interval '24 hours';

  delete from public.dashboard_activity_logs
  where id in (
    select id from public.dashboard_activity_logs
    order by created_at desc
    offset 20
  );

  return null;
end;
$$;

drop trigger if exists dashboard_activity_logs_prune on public.dashboard_activity_logs;
create trigger dashboard_activity_logs_prune
  after insert on public.dashboard_activity_logs
  for each row execute function public.prune_dashboard_activity_logs();
