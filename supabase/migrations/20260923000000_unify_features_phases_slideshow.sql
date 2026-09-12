-- Unify "Image Gallery" features and "Phases" as the only two Section
-- Types managed from /admin/features, each with its own per-item
-- slideshow control (0-10 seconds; 0 disables auto-advance, matching
-- the posts.slideshow_interval pattern already used by Notable Works).
--
-- Previously the Image Gallery carousel's speed was one global
-- site_settings.gallery_interval_ms value shared by every gallery
-- feature; now that each gallery/phase can set its own, that global
-- column is left in place (unused) rather than dropped, matching this
-- project's existing precedent of leaving a superseded settings column
-- inert (see site_settings.show_phases_section from the previous
-- migration) instead of a riskier drop.
alter table public.features
  add column if not exists slideshow_interval integer not null default 5
    check (slideshow_interval >= 0 and slideshow_interval <= 10);

alter table public.phases
  add column if not exists slideshow_interval integer not null default 0
    check (slideshow_interval >= 0 and slideshow_interval <= 10);
