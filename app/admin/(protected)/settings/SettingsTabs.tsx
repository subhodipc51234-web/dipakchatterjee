// app/admin/(protected)/settings/SettingsTabs.tsx
//
// Splits the Settings page's many independent forms/managers into
// categorized tabs so the page doesn't read as one long scroll. Each
// tab's contents are rendered server-side in page.tsx and handed down
// as plain ReactNode props (composition pattern) — this component only
// owns which tab is active, not any of the data fetching underneath.

"use client";

import { useState, type ReactNode } from "react";

const TABS = [
  { id: "general", label: "General Settings" },
  { id: "sections", label: "Homepage Sections" },
  { id: "header", label: "Header & Navigation" },
  { id: "hero", label: "Hero & Bio" },
  { id: "media", label: "Media & Display" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsTabs({
  general,
  sections,
  header,
  hero,
  media,
}: Record<TabId, ReactNode>) {
  const [active, setActive] = useState<TabId>("general");
  const panels: Record<TabId, ReactNode> = { general, sections, header, hero, media };

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
