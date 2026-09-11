-- Dynamic header action items (buttons/links shown in the site header,
-- e.g. "Submit a Complaint" or a Facebook follow button). Replaces the
-- previously hardcoded "Submit a Complaint" button as the sole header
-- action; seeded below so current behavior is preserved after the
-- switch to the dynamic list (same pattern as cta_buttons).
create table public.header_actions (
  id uuid primary key default gen_random_uuid(),
  label text not null default '',
  url text not null,
  icon text not null default 'none'
    check (icon in ('none', 'facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'whatsapp', 'other')),
  style text not null default 'solid' check (style in ('solid', 'outline', 'link')),
  position text not null default 'right' check (position in ('left', 'right')),
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.header_actions enable row level security;

create policy "Header actions are publicly readable"
  on public.header_actions for select
  using (true);

create policy "Admins can manage header actions"
  on public.header_actions for all
  using (is_admin())
  with check (is_admin());

insert into public.header_actions (label, url, icon, style, position, display_order)
values ('Submit a Complaint', '/complaints', 'none', 'solid', 'right', 0);

-- Admin-configurable auto-advance speed for the public hero/banner
-- (Public Life / Image Gallery feature) carousel. Milliseconds, so the
-- UI can offer a plain seconds input (value * 1000) without a separate
-- unit column.
alter table public.site_settings
  add column if not exists gallery_interval_ms integer not null default 6000;
