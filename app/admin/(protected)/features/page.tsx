// app/admin/(protected)/features/page.tsx
import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Feature } from "@/types/domain";
import FeatureList from "./FeatureList";

export default async function FeaturesPage() {
  const supabase = await createClient();

  const { data: features } = await supabase
    .from("features")
    .select("*")
    .order("display_order", { ascending: true });

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
    </div>
  );
}
