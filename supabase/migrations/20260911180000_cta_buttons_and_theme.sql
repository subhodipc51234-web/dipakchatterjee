-- Dynamic, admin-manageable CTA buttons. Replaces the single fixed
-- hero_cta_label/hero_cta_url pair as the primary hero CTA mechanism;
-- those columns stay in site_settings (unused, no data loss) rather than
-- being dropped.
create table public.cta_buttons (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  url text not null,
  color text, -- hex override; null = inherit site_settings.theme_primary_color
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cta_buttons enable row level security;

create policy "CTA buttons are publicly readable"
  on public.cta_buttons for select
  using (true);

create policy "Admins can manage CTA buttons"
  on public.cta_buttons for all
  using (is_admin())
  with check (is_admin());

-- Seed with the existing default hero CTA so current behavior is
-- preserved after the switch to the dynamic list.
insert into public.cta_buttons (label, url, display_order)
values ('View Notable Works', '#works', 0);

-- Site-wide theme colors, editable from Dashboard Settings and applied
-- via CSS custom properties on the public site.
alter table public.site_settings
  add column if not exists theme_primary_color text not null default '#C1832B',
  add column if not exists theme_secondary_color text not null default '#151F33';
