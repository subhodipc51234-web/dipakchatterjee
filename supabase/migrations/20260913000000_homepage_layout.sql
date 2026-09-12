-- Homepage Sections / Layout Builder (Settings): a single ordered list
-- of section keys ("organizations", "posts", or "feature:<uuid>")
-- controlling the exact sequence sections render in on the public
-- homepage. Null/empty until an admin reorders anything — the app
-- computes a sensible default order (see lib/homepage-layout.ts) when
-- this is unset or missing an entry (e.g. a newly created feature).
alter table public.site_settings
  add column if not exists homepage_layout jsonb;

-- Visibility for the two "fixed" homepage sections that aren't backed
-- by a features row (and so have no is_published of their own):
-- Organizations Worked With, and the Notable Works posts feed.
alter table public.site_settings
  add column if not exists show_organizations_section boolean not null default true,
  add column if not exists show_posts_feed_section boolean not null default true;

-- Streamline the homepage: only the Image Gallery stays enabled by
-- default going forward, alongside the always-on hero/bio and
-- organizations. Every other existing feature section (About, Stats,
-- custom sections, etc.) is switched to draft so an admin opts back in
-- deliberately via the new Layout Builder instead of everything
-- showing at once by default.
update public.features
  set is_published = false
  where type <> 'public_life_gallery';
