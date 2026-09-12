// app/admin/(protected)/phases/page.tsx
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import type { Phase } from "@/types/domain";
import PhaseList from "./PhaseList";

export const metadata: Metadata = {
  title: "Phases - Dashboard | Dipak Chatterjee",
};

export default async function PhasesPage() {
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div>
      <Link
        href="/admin/features"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-navy-900 mb-6"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Features
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-semibold text-saffron-600 mb-2">Features &rarr; Phases</p>
          <h1 className="font-display text-3xl text-navy-900">Life &amp; career milestones</h1>
          <p className="text-sm text-ink-600 mt-1.5">
            Chronological chapters (e.g. &ldquo;Teaching Career&rdquo;, &ldquo;Public Service&rdquo;), each
            with its own story and photo gallery.
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
  );
}
