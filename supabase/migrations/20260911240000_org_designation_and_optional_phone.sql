-- Role/designation shown beneath an affiliated organization's name in
-- the new interactive hover showcase (nullable: existing rows keep
-- showing just the name until an admin fills this in).
alter table public.organizations
  add column if not exists designation text;

-- Phone number becomes optional on the public complaint form; existing
-- rows are untouched, new submissions may now omit it.
alter table public.complaints
  alter column contact_phone drop not null;
