-- Promote life_phases to a first-class "phases" feature (same table,
-- same rows/photos — just renamed, matching Notable Works' own naming),
-- and give it the same pin-to-top ordering Notable Works already has.
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'life_phases') then
    alter table public.life_phases rename to phases;
  elsif not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'phases') then
    create table public.phases (
      id uuid primary key default gen_random_uuid(),
      title text not null,
      period text,
      summary text,
      content text,
      photos jsonb not null default '[]'::jsonb,
      sort_order integer not null default 0,
      created_at timestamptz not null default now()
    );

    alter table public.phases enable row level security;

    create policy "Phases are publicly readable"
      on public.phases for select
      using (true);

    create policy "Admins can insert phases"
      on public.phases for insert
      to authenticated
      with check (is_admin());

    create policy "Admins can update phases"
      on public.phases for update
      to authenticated
      using (is_admin())
      with check (is_admin());

    create policy "Admins can delete phases"
      on public.phases for delete
      to authenticated
      using (is_admin());
  end if;
end $$;

alter table public.phases
  add column if not exists is_pinned boolean not null default false;

create index if not exists phases_pinned_sort_idx
  on public.phases (is_pinned desc, sort_order asc);

-- RLS policies survive the rename automatically; just re-labeling them
-- so they read "phases" instead of the old "life phases" wording.
do $$
begin
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'phases' and policyname = 'Life phases are publicly readable') then
    alter policy "Life phases are publicly readable" on public.phases rename to "Phases are publicly readable";
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'phases' and policyname = 'Admins can insert life phases') then
    alter policy "Admins can insert life phases" on public.phases rename to "Admins can insert phases";
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'phases' and policyname = 'Admins can update life phases') then
    alter policy "Admins can update life phases" on public.phases rename to "Admins can update phases";
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'phases' and policyname = 'Admins can delete life phases') then
    alter policy "Admins can delete life phases" on public.phases rename to "Admins can delete phases";
  end if;
end $$;

-- Whether the homepage's Phases showcase section is shown, mirroring
-- show_organizations_section / show_posts_feed_section.
alter table public.site_settings
  add column if not exists show_phases_section boolean not null default true;

-- Notable Works: consolidate the previous ad-hoc external_link /
-- facebook_url / embed_code columns into one structured list, so a post
-- can carry any number of links, each explicitly marked as an "embed"
-- (rendered as an iframe when its URL matches a known provider) or a
-- "button" (a plain call-to-action opening in a new tab) — see
-- types/domain.ts's PostLink for the shape.
alter table public.posts
  add column if not exists links jsonb not null default '[]'::jsonb;

update public.posts
set links = (
  select coalesce(jsonb_agg(link), '[]'::jsonb)
  from (
    select jsonb_build_object('id', gen_random_uuid()::text, 'url', external_link, 'type', 'embed') as link
    where external_link is not null
    union all
    select jsonb_build_object(
      'id', gen_random_uuid()::text,
      'url', facebook_url,
      'type', 'button',
      'label', 'View on Facebook'
    )
    where facebook_url is not null
  ) as gathered_links
)
where external_link is not null or facebook_url is not null;

-- embed_code held raw pasted HTML/SDK markup, which has no place in a
-- structured {url, type} link and is dropped here; any post relying on
-- it falls back to its external_link-derived link (already migrated
-- above) or simply renders without an embed.
alter table public.posts
  drop column if exists external_link,
  drop column if exists facebook_url,
  drop column if exists embed_code;

-- Per-post slideshow speed in whole seconds — replaces the old
-- millisecond image_interval_ms (1-60s) with the simpler 0-10s range;
-- 0 disables auto-advance entirely (manual arrows/dots only).
alter table public.posts
  add column if not exists slideshow_interval integer not null default 0;

alter table public.posts
  drop constraint if exists posts_slideshow_interval_check;

alter table public.posts
  add constraint posts_slideshow_interval_check check (slideshow_interval >= 0 and slideshow_interval <= 10);

update public.posts
set slideshow_interval = least(10, greatest(0, round(image_interval_ms / 1000.0)))
where image_interval_ms is not null;

alter table public.posts
  drop column if exists image_interval_ms;

alter table public.posts
  add column if not exists is_pinned boolean not null default false;

-- Ensure the configurable homepage feed limit exists (no-op if already present).
alter table public.site_settings
  add column if not exists notable_works_limit integer not null default 6;
