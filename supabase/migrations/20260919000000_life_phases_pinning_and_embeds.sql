-- Life Phases: chronological milestones ("Teaching Career", "Public
-- Service", ...), each with narrative copy and its own photo gallery.
-- Photos are stored inline as a JSONB array of { url, caption } rather
-- than a separate media table (unlike features/posts) since a phase's
-- gallery is small and always edited as a whole from one form.
create table public.life_phases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  period text,
  summary text,
  content text,
  photos jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.life_phases enable row level security;

create policy "Life phases are publicly readable"
  on public.life_phases for select
  using (true);

create policy "Admins can insert life phases"
  on public.life_phases for insert
  to authenticated
  with check (is_admin());

create policy "Admins can update life phases"
  on public.life_phases for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "Admins can delete life phases"
  on public.life_phases for delete
  to authenticated
  using (is_admin());

-- Bucket for the inline photos referenced from life_phases.photos.
insert into storage.buckets (id, name, public)
values ('phase-media', 'phase-media', true)
on conflict (id) do nothing;

create policy "Admins can upload to phase-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'phase-media' and is_admin());

create policy "Admins can update phase-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'phase-media' and is_admin())
  with check (bucket_id = 'phase-media' and is_admin());

create policy "Admins can delete from phase-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'phase-media' and is_admin());

-- Notable Works: pin-to-top ordering, plus a Facebook "View on Facebook"
-- button link kept separate from the actual embed markup so a post can
-- carry either, both, or neither without the two stepping on each other
-- (see lib/embed.ts / PostEmbed for how embed_code and external_link are
-- resolved into a renderable embed).
alter table public.posts
  add column if not exists is_pinned boolean not null default false,
  add column if not exists facebook_url text,
  add column if not exists embed_code text;

create index if not exists posts_pinned_published_idx
  on public.posts (is_pinned desc, published_at desc);

-- Configurable "how many posts show on the homepage feed" limit.
alter table public.site_settings
  add column if not exists notable_works_limit integer not null default 6;
