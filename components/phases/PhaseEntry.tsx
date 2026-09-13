// components/phases/PhaseEntry.tsx
//
// Public rendering of a single Phase. Phases render individually,
// interleaved with Image Gallery features in whatever order the
// unified /admin/features list sets (see lib/homepage-layout.ts) —
// there is deliberately no wrapping "Phases" section, group heading, or
// intro copy above these entries; each one just shows its own Title,
// Period, short Summary, and photo gallery/slideshow, side by side.
//
//   - Left column (~40%): title, then the period directly underneath it
//     in the exact same typography (font, size, color) as the title —
//     not a small uppercase eyebrow above it — then the short summary
//     and a "Read More" link to this phase's own page.
//   - Right column (~60%): PhaseGallery — an auto-advancing slideshow
//     when this phase has a slideshow interval set, otherwise a capped
//     grid with lightbox expand.
//   - Mobile: stacks vertically in the same order since the grid just
//     collapses to one column and the left column is first in document
//     order.

import Link from "next/link";
import type { Phase, PhasePhoto } from "@/types/domain";
import PhaseGallery from "./PhaseGallery";

export default function PhaseEntry({ phase }: { phase: Phase }) {
  const photos = (phase.photos as unknown as PhasePhoto[] | null) ?? [];

  return (
    <section id={`phase-${phase.id}`} className="py-16 md:py-24 bg-paper-100 border-y border-line">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-8 md:gap-12 items-start">
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-navy-900 leading-tight">{phase.title}</h2>
            {phase.period && (
              <p className="font-display text-2xl md:text-3xl text-navy-900 leading-tight">{phase.period}</p>
            )}

            <p className="mt-4 text-ink-600 leading-relaxed">{phase.summary}</p>

            <Link
              href={`/phases/${phase.id}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:underline"
            >
              Read More <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>

          <PhaseGallery
            photos={photos}
            slideshowIntervalMs={phase.slideshow_interval * 1000}
            maxDisplayImages={phase.max_display_images}
          />
        </div>
      </div>
    </section>
  );
}
