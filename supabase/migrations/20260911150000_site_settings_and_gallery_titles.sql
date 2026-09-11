-- Site-wide singleton settings (hero image, profile avatar) — separate
-- from `profiles`, since these are site content, not per-user data.
create table if not exists public.site_settings (
  id text primary key default 'default',
  hero_image_url text,
  hero_image_path text,
  avatar_url text,
  avatar_path text,
  updated_at timestamptz not null default now(),
  constraint site_settings_singleton check (id = 'default')
);

insert into public.site_settings (id) values ('default')
  on conflict (id) do nothing;

alter table public.site_settings enable row level security;

create policy "Site settings are publicly readable"
  on public.site_settings for select
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  using (is_admin())
  with check (is_admin());

-- Per-item title for feature media, so the Public Life gallery carousel can
-- show a heading in addition to the existing caption.
alter table public.feature_media add column if not exists title text;

-- New bucket for hero/profile images (site-wide, not tied to one feature
-- or post), mirroring the public-read / admin-write pattern already used
-- by the feature-media and post-media buckets.
insert into storage.buckets (id, name, public)
values ('site-media', 'site-media', true)
on conflict (id) do nothing;

create policy "Admins can upload to site-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-media' and is_admin());

create policy "Admins can update site-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-media' and is_admin())
  with check (bucket_id = 'site-media' and is_admin());

create policy "Admins can delete from site-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-media' and is_admin());
