// lib/homepage-layout.ts
//
// Shared between the public homepage (app/(site)/page.tsx) and the
// admin Homepage Layout Builder (Settings -> Homepage Sections) so both
// compute the exact same section order from the same inputs.
//
// site_settings.homepage_layout stores an ordered array of section
// keys: "organizations", "posts", `feature:<feature id>`, or
// `phase:<phase id>`. It only needs to record ordering — visibility for
// "organizations"/"posts" lives on their own site_settings booleans,
// and a feature's visibility is just its existing `is_published` (a
// phase has no such flag and is always shown) — so this never goes
// stale in a way that could hide content: any key missing from the
// stored array (a section never touched by the layout builder yet,
// most commonly a brand new feature or phase) is appended at the end in
// a sensible default order rather than silently dropped.
//
// Phases used to render as one fixed, always-last, ungrouped block
// (see git history for PhasesSection.tsx) separate from this ordering
// entirely. Now that /admin/features unifies Image Galleries and Phases
// into a single reorderable "Modular sections" list, each phase gets
// its own key here too — interleaved with features by combining
// features.display_order and phases.sort_order, both of which are
// written from the same shared index sequence by
// app/admin/(protected)/features/actions.ts's reorderSections() — so
// the merged default order below exactly matches the order chosen in
// that unified admin list.

import type { Feature, Phase } from "@/types/domain";

export const ORGANIZATIONS_SECTION_KEY = "organizations";
export const POSTS_SECTION_KEY = "posts";

export function featureSectionKey(featureId: string) {
  return `feature:${featureId}`;
}

export function featureIdFromKey(key: string): string | null {
  return key.startsWith("feature:") ? key.slice("feature:".length) : null;
}

export function phaseSectionKey(phaseId: string) {
  return `phase:${phaseId}`;
}

export function phaseIdFromKey(key: string): string | null {
  return key.startsWith("phase:") ? key.slice("phase:".length) : null;
}

/**
 * Merges the admin's stored order with every section that currently
 * exists (organizations, posts, each feature, and each phase), so a
 * section that was never explicitly reordered still renders — appended
 * at the end, in a stable default order — instead of disappearing.
 */
export function computeHomepageOrder(
  storedOrder: unknown,
  features: Pick<Feature, "id" | "display_order">[],
  phases: Pick<Phase, "id" | "sort_order">[] = []
): string[] {
  const sortedSectionKeys = [
    ...features.map((f) => ({ key: featureSectionKey(f.id), order: f.display_order })),
    ...phases.map((p) => ({ key: phaseSectionKey(p.id), order: p.sort_order })),
  ]
    .sort((a, b) => a.order - b.order)
    .map((x) => x.key);

  const known = new Set([ORGANIZATIONS_SECTION_KEY, POSTS_SECTION_KEY, ...sortedSectionKeys]);
  const stored = Array.isArray(storedOrder)
    ? storedOrder.filter((k): k is string => typeof k === "string" && known.has(k))
    : [];

  const defaultOrder = [ORGANIZATIONS_SECTION_KEY, ...sortedSectionKeys, POSTS_SECTION_KEY];
  const seen = new Set(stored);

  return [...stored, ...defaultOrder.filter((k) => !seen.has(k))];
}
