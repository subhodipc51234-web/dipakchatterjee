// app/admin/(protected)/settings/SettingsTabs.tsx
//
// Splits the Settings page's many independent forms/managers into
// categorized tabs so the page doesn't read as one long scroll. Each
// tab's contents are rendered server-side in page.tsx and handed down
// as plain ReactNode props (composition pattern) — this component only
// owns which tab is active, not any of the data fetching underneath.

"use client";

import { useEffect, useState, type ReactNode } from "react";

const TABS = [
  { id: "general", label: "General Settings" },
  { id: "sections", label: "Homepage Sections" },
  { id: "header", label: "Header & Navigation" },
  { id: "hero", label: "Hero & Bio" },
  { id: "media", label: "Media & Display" },
  { id: "users", label: "Users & Access" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// The route's own <title> (set via metadata in page.tsx) covers the
// General tab, which is what loads by default. Switching tabs here is
// client-side state, not a navigation, so Next's metadata API never
// re-runs for the others — this keeps the visible browser tab in sync
// by hand. "Users & Access" gets the short "Users" title called for in
// the spec; every other tab reuses its own label.
const TAB_TITLES: Record<TabId, string> = {
  general: "Settings - Dashboard | Dipak Chatterjee",
  sections: "Homepage Sections - Dashboard | Dipak Chatterjee",
  header: "Header & Navigation - Dashboard | Dipak Chatterjee",
  hero: "Hero & Bio - Dashboard | Dipak Chatterjee",
  media: "Media & Display - Dashboard | Dipak Chatterjee",
  users: "Users - Dashboard | Dipak Chatterjee",
};

export default function SettingsTabs({
  general,
  sections,
  header,
  hero,
  media,
  users,
}: Record<TabId, ReactNode>) {
  const [active, setActive] = useState<TabId>("general");
  const panels: Record<TabId, ReactNode> = { general, sections, header, hero, media, users };

  useEffect(() => {
    document.title = TAB_TITLES[active];
  }, [active]);

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-line mb-6 -mt-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActive(tab.id)}
            aria-current={active === tab.id}
            className={`px-4 py-2.5 text-sm font-semibold rounded-t-md border-b-2 -mb-px transition-colors ${
              active === tab.id
                ? "border-saffron text-saffron-600"
                : "border-transparent text-ink-400 hover:text-navy-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">{panels[active]}</div>
    </div>
  );
}
