// app/admin/(protected)/arrangement/page.tsx
//
// Dedicated page for reordering/hiding the movable homepage sections
// (Organizations, the Notable Works posts feed, and every Feature/Phase)
// between the fixed Header+Hero and Footer bookends. Replaces the old
// Settings -> Homepage Sections tab (see ArrangementManager.tsx) — the
// underlying data is unchanged (site_settings.homepage_layout, computed
// via lib/homepage-layout.ts, same as app/(site)/page.tsx reads).

import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import type { Feature, Phase, SiteSettings } from "@/types/domain";
import { computeHomepageOrder } from "@/lib/homepage-layout";
import ArrangementManager from "./ArrangementManager";

export const metadata: Metadata = {
  title: "Arrangement - Dashboard | Dipak Chatterjee",
};

export default async function ArrangementPage() {
  const supabase = await createClient();

  const [{ data: settings }, { data: features }, { data: phases }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("homepage_layout, show_organizations_section, show_posts_feed_section")
      .eq("id", "default")
      .single(),
    // Every feature, published or not — an admin needs to see and be
    // able to re-enable a currently-hidden section here.
    supabase.from("features").select("*").order("display_order", { ascending: true }),
    supabase.from("phases").select("*").order("sort_order", { ascending: true }),
  ]);

  const s = settings as Pick<
    SiteSettings,
    "homepage_layout" | "show_organizations_section" | "show_posts_feed_section"
  > | null;
  const featureList = (features as Feature[]) ?? [];
  const phaseList = (phases as Phase[]) ?? [];
  const homepageOrder = computeHomepageOrder(s?.homepage_layout, featureList, phaseList);

  return (
    <div className="max-w-2xl">
      <p className="text-sm font-semibold text-saffron-600 mb-2">Arrangement</p>
      <h1 className="font-display text-3xl text-navy-900 mb-1">Homepage Layout</h1>
      <p className="text-sm text-ink-600 mb-8">
        Reorder and show/hide the sections that render between the hero and the footer on the
        public homepage. Header, Hero, and Footer always stay in place.
      </p>

      <ArrangementManager
        initialOrder={homepageOrder}
        features={featureList}
        phases={phaseList}
        organizationsVisible={s?.show_organizations_section ?? true}
        postsVisible={s?.show_posts_feed_section ?? true}
      />
    </div>
  );
}
