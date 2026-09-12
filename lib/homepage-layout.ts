// lib/homepage-layout.ts
//
// Shared between the public homepage (app/(site)/page.tsx) and the
// admin Homepage Layout Builder (Settings -> Homepage Sections) so both
// compute the exact same section order from the same inputs.
//
// site_settings.homepage_layout stores an ordered array of section
// keys: "organizations", "posts", or `feature:<feature id>`. It only
// needs to record ordering — visibility for "organizations"/"posts"
// lives on their own site_settings booleans, and a feature's visibility
// is just its existing `is_published` — so this never goes stale in a
// way that could hide content: any key missing from the stored array
// (a section never touched by the layout builder yet, most commonly a
// brand new feature) is appended at the end in a sensible default
// order rather than silently dropped.

import type { Feature } from "@/types/domain";

export const ORGANIZATIONS_SECTION_KEY = "organizations";
export const POSTS_SECTION_KEY = "posts";

export function featureSectionKey(featureId: string) {
  return `feature:${featureId}`;
}

export function featureIdFromKey(key: string): string | null {
  return key.startsWith("feature:") ? key.slice("feature:".length) : null;
}

/**
 * Merges the admin's stored order with every section that currently
 * exists (organizations, posts, and each feature), so a section that
 * was never explicitly reordered still renders — appended at the end,
 * in a stable default order — instead of disappearing.
 */
export function computeHomepageOrder(
  storedOrder: unknown,
  features: Pick<Feature, "id" | "display_order">[]
): string[] {
  const sortedFeatureKeys = [...features]
    .sort((a, b) => a.display_order - b.display_order)
    .map((f) => featureSectionKey(f.id));

  const known = new Set([ORGANIZATIONS_SECTION_KEY, POSTS_SECTION_KEY, ...sortedFeatureKeys]);
  const stored = Array.isArray(storedOrder)
    ? storedOrder.filter((k): k is string => typeof k === "string" && known.has(k))
    : [];

  const defaultOrder = [ORGANIZATIONS_SECTION_KEY, ...sortedFeatureKeys, POSTS_SECTION_KEY];
  const seen = new Set(stored);

  return [...stored, ...defaultOrder.filter((k) => !seen.has(k))];
}
