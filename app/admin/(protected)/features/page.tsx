// app/admin/(protected)/features/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Feature, Phase } from "@/types/domain";
import FeatureList from "./FeatureList";
import PhaseList from "../phases/PhaseList";

export const metadata: Metadata = {
  title: "Features - Dashboard | Dipak Chatterjee",
};

export default async function FeaturesPage() {
  const supabase = await createClient();

  const [{ data: features }, { data: phases }] = await Promise.all([
    supabase.from("features").select("*").order("display_order", { ascending: true }),
    supabase.from("phases").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-saffron-600 mb-2">Features</p>
          <h1 className="font-display text-3xl text-navy-900">Modular sections</h1>
          <p className="text-sm text-ink-600 mt-1.5">
            About, Public Life, press features, and other homepage sections. Drag to reorder.
          </p>
        </div>

        <Link
          href="/admin/features/new"
          className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 text-white font-semibold px-4 py-2.5 rounded-md transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Feature
        </Link>
      </div>

      <FeatureList features={(features as Feature[]) ?? []} />

      <div className="mt-12 pt-8 border-t border-line">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-sm font-semibold text-saffron-600 mb-2">Features &rarr; Phases</p>
            <h2 className="font-display text-2xl text-navy-900">Life &amp; career milestones</h2>
            <p className="text-sm text-ink-600 mt-1.5">
              Chronological chapters (e.g. &ldquo;Teaching Career&rdquo;, &ldquo;Public Service&rdquo;) shown
              in their own modular subsection, right below Features, on the public homepage.
            </p>
          </div>

          <Link
            href="/admin/phases/new"
            className="inline-flex items-center gap-2 bg-saffron hover:bg-saffron-600 text-white font-semibold px-4 py-2.5 rounded-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            New Phase
          </Link>
        </div>

        <PhaseList phases={(phases as Phase[]) ?? []} />
      </div>
    </div>
  );
}
