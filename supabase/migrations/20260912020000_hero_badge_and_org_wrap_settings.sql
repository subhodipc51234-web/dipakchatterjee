-- Editable text for the hero portrait's floating corner badge (Settings
-- -> Hero content). Nullable so existing installs keep showing the
-- original hardcoded "Chanchal, North Malda" / "Community Leader" copy
-- (the app-level fallback) until an admin fills these in.
alter table public.site_settings
  add column if not exists hero_badge_subtitle text,
  add column if not exists hero_badge_title text;

-- Max organizations kept on a single row before wrapping in the
-- "Organizations Worked With" strip (Settings -> Affiliated
-- Organizations). Matches gallery_interval_ms's pattern: a plain
-- site_settings column with a sensible default so existing installs are
-- unaffected until an admin changes it.
alter table public.site_settings
  add column if not exists org_max_per_row integer not null default 6;
