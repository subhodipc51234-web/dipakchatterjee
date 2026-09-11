-- Social links shown in the footer's "Follow" block, fully dashboard-
-- managed (platform, URL, order) instead of the single hardcoded
-- Facebook link.
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null default 'other',
  label text,
  url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.social_links enable row level security;

create policy "Social links are publicly readable"
  on public.social_links for select
  using (true);

create policy "Admins can manage social links"
  on public.social_links for all
  using (is_admin())
  with check (is_admin());

-- Modular footer: an ordered list of blocks, each either free-form
-- custom content (title + body — office address, hours, notices,
-- disclosures, anything), a set of admin-defined quick links, or a
-- placement for the Follow/social row above. Replaces the previous
-- fixed office_address/office_email/office_hours_* fields and the
-- hardcoded Quick Links column.
create table public.footer_blocks (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('custom_content', 'quick_links', 'follow')),
  title text,
  body text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.footer_blocks enable row level security;

create policy "Footer blocks are publicly readable"
  on public.footer_blocks for select
  using (true);

create policy "Admins can manage footer blocks"
  on public.footer_blocks for all
  using (is_admin())
  with check (is_admin());

create table public.footer_links (
  id uuid primary key default gen_random_uuid(),
  footer_block_id uuid not null references public.footer_blocks(id) on delete cascade,
  label text not null,
  url text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.footer_links enable row level security;

create policy "Footer links are publicly readable"
  on public.footer_links for select
  using (true);

create policy "Admins can manage footer links"
  on public.footer_links for all
  using (is_admin())
  with check (is_admin());

-- Seed data equivalent to the previous hardcoded footer, so the public
-- site isn't left with an empty footer the moment this ships.
insert into public.footer_blocks (type, title, body, display_order) values
  ('custom_content', 'Office', 'Community Service Office
Chanchal
Malda 732123, West Bengal

dipak.chatterjee304@gmail.com', 0),
  ('quick_links', 'Quick Links', null, 1),
  ('follow', 'Follow', null, 2);

insert into public.footer_links (footer_block_id, label, url, display_order)
select id, l.label, l.url, l.ord
from public.footer_blocks
cross join (values
  ('About', '#about', 0),
  ('Notable Works', '#works', 1),
  ('Public Life', '#public-life', 2)
) as l(label, url, ord)
where type = 'quick_links';

insert into public.social_links (platform, url, display_order) values
  ('facebook', 'https://www.facebook.com/dipak.chatterjee.180', 0);
