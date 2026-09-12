-- Dedicated thumbnail image for a post (Admin -> Posts -> edit), used
-- exclusively for the post card on the homepage feed and any other
-- index/listing view — independent of post_media, which stays the
-- source for the detail page's images/video. Nullable: falls back to
-- the post's first post_media item (see components/posts/PostsFeed.tsx)
-- until an admin sets one.
alter table public.posts
  add column if not exists thumbnail_url text,
  add column if not exists thumbnail_path text;
