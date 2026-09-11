-- Simplified complaint form: the public form now only collects
-- description + phone number. title/location stay as columns (for any
-- legacy rows / admin display) but are no longer required.
alter table public.complaints
  alter column title drop not null,
  alter column location drop not null;

-- Dynamic footer/contact fields, editable from Dashboard Settings ->
-- Footer & Contact. office_hours_enabled defaults to false, so the
-- previously-static Office Hours block is off by default and can be
-- switched back on (with custom text) at any time.
alter table public.site_settings
  add column if not exists office_address text,
  add column if not exists office_email text,
  add column if not exists office_hours_enabled boolean not null default false,
  add column if not exists office_hours_text text;
