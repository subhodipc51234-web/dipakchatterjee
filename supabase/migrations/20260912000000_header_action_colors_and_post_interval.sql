-- Per-action color overrides for header action buttons (Settings ->
-- Header Actions). Nullable hex values; null = fall back to the
-- existing solid/outline/link style classes, same override pattern as
-- cta_buttons.color.
alter table public.header_actions
  add column if not exists bg_color text,
  add column if not exists text_color text;

-- Per-post auto-advance speed for a post's image carousel (Post form ->
-- "Slideshow interval"). Milliseconds, nullable = fall back to the
-- carousel's built-in default; same unit/override pattern as
-- site_settings.gallery_interval_ms.
alter table public.posts
  add column if not exists image_interval_ms integer;
