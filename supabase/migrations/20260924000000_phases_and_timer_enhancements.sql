-- Decimal-precision timers, plus Phases parity with Image
-- Gallery/Notable Works: an independent publish toggle, a Full Story
-- field for the dedicated "Read More" view, and a homepage image cap
-- for when the slideshow is off.

-- 1. Timer precision: every slideshow/auto-advance interval column was
-- `integer` (whole seconds only). Widen to numeric(4,2) so admins can
-- set fractional intervals (e.g. 2.5, 3.75) — every consumer already
-- just multiplies by 1000 and treats 0/falsy as "auto-advance
-- disabled", so this is a pure precision upgrade with no read-side
-- migration needed. Existing CHECK constraints (0-10) stay attached and
-- are re-validated automatically against the new column type.
alter table public.features
  alter column slideshow_interval type numeric(4, 2) using slideshow_interval::numeric(4, 2),
  alter column slideshow_interval set default 5.00;

alter table public.posts
  alter column slideshow_interval type numeric(4, 2) using slideshow_interval::numeric(4, 2),
  alter column slideshow_interval set default 0.00;

alter table public.phases
  alter column slideshow_interval type numeric(4, 2) using slideshow_interval::numeric(4, 2),
  alter column slideshow_interval set default 0.00;

-- 2. Phases parity with Features/Posts:
--   - is_published: independent publish gating, matching Image Gallery.
--     Production only ever had a single placeholder ("Test Phase") row
--     at the time of this migration, but it's backfilled to published
--     anyway (rather than silently vanishing from the live site) so this
--     migration is safe to replay against any environment that already
--     has real phases.
--   - full_content: the detailed narrative for the dedicated "Read
--     More" view. `summary` goes back to being the short homepage blurb
--     (see the streamline migration this reverses part of) now that
--     the two have distinct homepage vs. full-page audiences again.
--   - max_display_images: caps the homepage grid when the slideshow is
--     off (PhaseGallery renders a slideshow instead of a grid whenever
--     slideshow_interval > 0 — see components/phases/PhaseGallery.tsx).
-- `photos` (jsonb) needs no column change to carry an optional `fact`
-- per photo alongside its existing `url`/`caption` — jsonb already
-- accepts any shape; see types/domain.ts's PhasePhoto.
alter table public.phases
  add column if not exists is_published boolean not null default false,
  add column if not exists full_content text,
  add column if not exists max_display_images integer not null default 4 check (max_display_images >= 1);

update public.phases set is_published = true;

-- 3. RLS: phases was previously `using (true)` (unconditionally public)
-- since it had no publish concept. Replace with the same
-- published-or-admin shape features/posts use, so a draft phase is
-- hidden from the public site but still visible to an admin editing it
-- (the admin edit page queries through the user's own session, not a
-- service role, so it relies on this same policy).
drop policy if exists "Phases are publicly readable" on public.phases;

create policy "Phases are publicly readable"
  on public.phases for select
  using (is_published = true or is_admin());
