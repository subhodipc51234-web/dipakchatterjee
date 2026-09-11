-- Dynamic hero/landing copy, editable from Dashboard Settings -> Landing.
-- All nullable: app/(site)/page.tsx falls back to the original static
-- copy when any of these are empty.
alter table public.site_settings
  add column if not exists hero_eyebrow text,
  add column if not exists hero_headline text,
  add column if not exists hero_body text,
  add column if not exists hero_cta_label text,
  add column if not exists hero_cta_url text;

-- Affiliated-organization logo strip shown in the hero, replacing the old
-- static stats counters.
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  logo_path text not null,
  external_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

create policy "Organizations are publicly readable"
  on public.organizations for select
  using (true);

create policy "Admins can manage organizations"
  on public.organizations for all
  using (is_admin())
  with check (is_admin());
