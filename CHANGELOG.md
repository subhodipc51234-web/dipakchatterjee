# Changelog

## [v1.0.0] - 2026-09-13

**Commit:** `74ba91e`

### Summary of What Changed

- Added a dedicated `/admin/arrangement` page for reordering homepage sections, replacing the old Settings -> Homepage Sections tab.
- Enforced layout boundaries in the admin UI: Header and Hero are shown as locked cards fixed at the top, Footer as a locked card fixed at the bottom (these were already structurally fixed on the public site by `app/(site)/layout.tsx` and `app/(site)/page.tsx` — this makes that boundary visible and explicit in the dashboard too).
- Kept "Posts / Notable Works", Organizations, and every modular Feature/Phase section dynamically reorderable between the locked Header/Hero and Footer.
- Added drag-and-drop handles plus Move Up / Move Down directional buttons (disabled at the top/bottom of the movable zone) and a visibility (eye) toggle per section.
- Added an "Arrangement" item (with a rows/reorder icon) to the admin sidebar navigation.
- Wired an audit log entry (`UPDATE_ARRANGEMENT` / "Reordered homepage sections") whenever the layout order is saved.

### Note on database changes

No new migration was required. The ordering/visibility data model this page needs (`site_settings.homepage_layout`, `show_organizations_section`, `show_posts_feed_section`, and each feature's `is_published`) already existed from prior migrations (see `20260913000000_homepage_layout.sql` and `20260923000000_unify_features_phases_slideshow.sql`). `npx supabase db push --linked` was run and confirmed the remote database is already up to date, and `npm run update-types` produced no diff in `types/database.types.ts`.

### Files Edited

- `app/admin/(protected)/arrangement/page.tsx`
- `app/admin/(protected)/arrangement/ArrangementManager.tsx`
- `app/admin/(protected)/arrangement/actions.ts`
- `app/admin/(protected)/settings/page.tsx`
- `app/admin/(protected)/settings/actions.ts`
- `app/admin/(protected)/settings/HomepageLayoutManager.tsx` (removed, superseded by the Arrangement page)
- `app/admin/(protected)/features/actions.ts`
- `components/admin/AdminSidebar.tsx`
- `CHANGELOG.txt`
- `CHANGELOG.md`
