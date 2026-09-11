-- Complaints portal. Deliberately NO public insert policy on either table
-- or on the storage bucket: submissions are created exclusively by the
-- submitComplaint Server Action using the service-role key (which bypasses
-- RLS entirely), so there is no path for an anonymous script to write
-- directly against the Supabase REST/Storage API. Every other operation
-- (select/update/delete) is admin-only, keeping the portal genuinely
-- private end to end.

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  description text not null,
  contact_phone text not null,
  contact_email text,
  reference_link text,
  is_expired boolean not null default false,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.complaints enable row level security;

create policy "Admins can view complaints"
  on public.complaints for select
  using (is_admin());

create policy "Admins can update complaints"
  on public.complaints for update
  using (is_admin())
  with check (is_admin());

create policy "Admins can delete complaints"
  on public.complaints for delete
  using (is_admin());

create table public.complaint_media (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid not null references public.complaints(id) on delete cascade,
  kind text not null check (kind in ('image', 'video')),
  storage_path text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.complaint_media enable row level security;

create policy "Admins can view complaint media"
  on public.complaint_media for select
  using (is_admin());

create policy "Admins can delete complaint media"
  on public.complaint_media for delete
  using (is_admin());

-- Private bucket: attachments may contain personal photos/videos tied to
-- a citizen's phone number, never served via a public URL. Admin viewing
-- goes through short-lived signed URLs generated server-side.
insert into storage.buckets (id, name, public)
values ('complaint-media', 'complaint-media', false)
on conflict (id) do nothing;

create policy "Admins can view complaint media files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'complaint-media' and is_admin());

create policy "Admins can delete complaint media files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'complaint-media' and is_admin());

-- Global default expiration window (days) for new complaints, editable
-- from Dashboard Settings.
alter table public.site_settings
  add column if not exists complaint_expiration_days integer not null default 7;
