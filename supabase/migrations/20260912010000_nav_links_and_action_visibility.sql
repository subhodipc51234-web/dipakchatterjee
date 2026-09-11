-- Dynamic primary nav links (the "About" / "Public Life" / "Notable
-- Works" / "Contact" row in the header — see components/site/SiteHeader.tsx).
-- Previously a hardcoded NAV_LINKS array; seeded below with those exact
-- values so current behavior is preserved after the switch to a
-- dashboard-managed list. Same shape/RLS pattern as header_actions.
create table public.nav_links (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  is_visible boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.nav_links enable row level security;

create policy "Nav links are publicly readable"
  on public.nav_links for select
  using (true);

create policy "Admins can manage nav links"
  on public.nav_links for all
  using (is_admin())
  with check (is_admin());

insert into public.nav_links (label, url, display_order) values
  ('About', '/#about', 0),
  ('Public Life', '/#public-life', 1),
  ('Notable Works', '/#works', 2),
  ('Contact', '/#contact', 3);

-- Visibility toggle for header action buttons/links, matching nav_links.
-- Existing rows default to visible so current behavior is unchanged.
alter table public.header_actions
  add column if not exists is_visible boolean not null default true;
