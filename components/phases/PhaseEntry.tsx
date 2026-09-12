// components/phases/PhaseEntry.tsx
//
// Public rendering of a single Phase. Phases now render individually,
// interleaved with Image Gallery features in whatever order the
// unified /admin/features list sets (see lib/homepage-layout.ts) —
// there is deliberately no wrapping "Phases" section, group heading, or
// intro copy above these entries; each one just shows its own Title,
// Period, Summary narrative, and photo gallery, side by side.
//
//   - Left column (~40%): period + title, then the summary narrative.
//   - Right column (~60%): a photo grid with lightbox expand
//     (auto-advancing in the lightbox if the phase has a slideshow
//     interval set — see PhaseGallery).
//   - Mobile: stacks vertically in the same order (title/period, then
//     summary, then gallery) since the grid just collapses to one
//     column and the left column is first in document order.

import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import type { Phase, PhasePhoto } from "@/types/domain";
import PhaseGallery from "./PhaseGallery";

const proseComponents: Components = {
  p: ({ children }) => <p className="leading-relaxed">{children}</p>,
};

export default function PhaseEntry({ phase }: { phase: Phase }) {
  const photos = (phase.photos as unknown as PhasePhoto[] | null) ?? [];

  return (
    <section id={`phase-${phase.id}`} className="py-16 md:py-24 bg-paper-100 border-y border-line">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-12 items-start">
          <div>
            {phase.period && (
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--theme-primary)] mb-2">
                {phase.period}
              </p>
            )}
            <h2 className="font-display text-2xl md:text-3xl text-navy-900 leading-tight">{phase.title}</h2>

            <div className="mt-4 text-ink-600 leading-relaxed [&_p]:mb-4 last:[&_p]:mb-0">
              <ReactMarkdown components={proseComponents}>{phase.summary}</ReactMarkdown>
            </div>
          </div>

          <PhaseGallery photos={photos} slideshowIntervalMs={phase.slideshow_interval * 1000} />
        </div>
      </div>
    </section>
  );
}
