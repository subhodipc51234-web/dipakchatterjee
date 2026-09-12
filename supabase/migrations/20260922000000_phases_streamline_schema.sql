-- Streamline `phases` down to the 4-field editorial schema (title,
-- period, summary, photos) now that it's a modular subsection of
-- Features rather than a first-class, independently pinnable homepage
-- section: drop the separate `content` narrative field (summary now
-- *is* the full story) and `is_pinned` (no more pin-to-top ordering —
-- phases render in plain sort_order).
--
-- Table is empty in production as of this migration, but the backfill
-- below is included anyway so this migration stays correct if ever
-- replayed against an environment that already has rows.
update public.phases
set summary = coalesce(nullif(summary, ''), content, '')
where summary is null;

alter table public.phases
  alter column summary set not null;

drop index if exists phases_pinned_sort_idx;

alter table public.phases
  drop column if exists content,
  drop column if exists is_pinned;

create index if not exists phases_sort_order_idx on public.phases (sort_order asc);

-- RLS is unchanged: "Phases are publicly readable" (select, true) and
-- the three is_admin()-gated admin write policies from the previous
-- migration already match this task's "public SELECT, admin-only write"
-- requirement exactly — nothing to alter there.
