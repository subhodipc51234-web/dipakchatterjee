-- Dynamic header branding text and footer text, editable from Dashboard
-- Settings -> Branding. All nullable: SiteHeader/SiteFooter fall back to
-- the original static copy when any of these are empty.
alter table public.site_settings
  add column if not exists header_name text,
  add column if not exists header_subtitle text,
  add column if not exists footer_tagline text,
  add column if not exists footer_copyright_name text,
  add column if not exists footer_note text;
