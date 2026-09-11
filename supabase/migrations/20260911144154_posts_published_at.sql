-- Rename posts.event_date -> posts.published_at and widen it to a full
-- timestamp so historical posts can be backdated to a specific date+time,
-- not just a date. Defaults to now() so unset posts still sort correctly.
alter table public.posts rename column event_date to published_at;
alter table public.posts alter column published_at type timestamptz using published_at::timestamptz;
alter table public.posts alter column published_at set default now();
