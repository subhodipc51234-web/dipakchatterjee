// app/(site)/phases/page.tsx
//
// Public "Phases" archive: every phases row, pinned first then
// chronologically (sort_order), each with its narrative and a photo
// gallery with captions. A phase with no photos just renders its text.
// Each entry carries an id anchor (#phase-<id>) so the homepage
// showcase's "Read More" cards can deep-link straight to it.

import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { createClient } from "@/utils/supabase/server";
import type { Phase, PhasePhoto } from "@/types/domain";
import RevealOnScroll from "@/components/RevealOnScroll";

export const metadata: Metadata = {
  title: "Phases | Dipak Chatterjee",
};

function PhaseGallery({ photos }: { photos: PhasePhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-6">
      {photos.map((photo) => (
        <figure key={photo.path || photo.url} className="rounded-lg overflow-hidden border border-line bg-navy-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt={photo.caption || ""} className="w-full max-h-[420px] object-contain" />
          {photo.caption && (
            <figcaption className="px-3 py-2.5 text-sm text-ink-600 leading-relaxed bg-paper-100">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

function PhaseEntry({ phase, index }: { phase: Phase; index: number }) {
  const photos = (phase.photos as unknown as PhasePhoto[] | null) ?? [];

  return (
    <RevealOnScroll>
      <article id={`phase-${phase.id}`} className={`py-10 md:py-14 scroll-mt-20 ${index > 0 ? "border-t border-line" : ""}`}>
        {phase.period && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-primary)] mb-2">
            {phase.period}
          </p>
        )}
        <h2 className="font-display text-2xl md:text-3xl text-navy-900 leading-tight">{phase.title}</h2>

        {phase.summary && <p className="mt-3 text-ink-600 leading-relaxed max-w-2xl">{phase.summary}</p>}

        {phase.content && (
          <div className="mt-5 max-w-2xl text-ink-600 leading-relaxed [&_p]:leading-relaxed [&_p]:mb-4">
            <ReactMarkdown>{phase.content}</ReactMarkdown>
          </div>
        )}

        <PhaseGallery photos={photos} />
      </article>
    </RevealOnScroll>
  );
}

export default async function PhasesPage() {
  const supabase = await createClient();

  const { data: phases } = await supabase
    .from("phases")
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("sort_order", { ascending: true });

  const phaseList = (phases as Phase[]) ?? [];

  return (
    <main className="bg-paper-100 min-h-screen">
      <div className="max-w-4xl mx-auto px-5 md:px-8 py-12 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">Phases</p>
        <h1 className="font-display text-3xl md:text-4xl text-navy-900 leading-tight max-w-2xl">
          A life in chapters &mdash; teaching, organising, and public service.
        </h1>

        {phaseList.length === 0 ? (
          <p className="text-ink-400 text-sm mt-10">Milestones will appear here soon.</p>
        ) : (
          <div>
            {phaseList.map((phase, i) => (
              <PhaseEntry key={phase.id} phase={phase} index={i} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
