-- Resolved/Unresolved tracking for complaints, shown as a badge and
-- toggle in the admin dashboard, independent of the existing
-- new/active/expired time-based labeling.
alter table public.complaints
  add column if not exists status text not null default 'unresolved' check (status in ('unresolved', 'resolved'));
