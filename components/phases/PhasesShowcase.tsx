// components/phases/PhasesShowcase.tsx
//
// Homepage "Phases" section, styled the same way as Notable Works
// (components/posts/PostsFeed.tsx): a card grid with a "View All"
// button through to the dedicated archive page. Since a phase has no
// standalone detail page, each card instead deep-links to its own
// entry on /phases via an anchor id.

import Link from "next/link";
import type { Phase, PhasePhoto } from "@/types/domain";
import RevealOnScroll from "@/components/RevealOnScroll";

function PhaseCard({ phase }: { phase: Phase }) {
  const photos = (phase.photos as unknown as PhasePhoto[] | null) ?? [];
  const cover = photos[0];

  return (
    <article className="h-full bg-black/20 border border-white/10 rounded-lg overflow-hidden flex flex-col">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover.url} alt={cover.caption || ""} className="w-full aspect-video object-cover" />
      )}

      <div className="p-5 flex-1 flex flex-col">
        {phase.period && (
          <p className="text-xs text-[var(--theme-primary)] font-semibold">{phase.period}</p>
        )}

        <h3 className="font-display text-xl text-white mt-2">{phase.title}</h3>

        {phase.summary && (
          <p className="mt-3 text-sm text-paper-100/70 leading-relaxed">{phase.summary}</p>
        )}

        <Link
          href={`/phases#phase-${phase.id}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--theme-primary)] hover:underline"
        >
          Read More <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </article>
  );
}

export default function PhasesShowcase({ phases }: { phases: Phase[] }) {
  return (
    <section id="phases" className="py-16 md:py-24 bg-[var(--theme-secondary)]">
      <div className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="mb-10">
          <p className="text-[var(--theme-primary)] font-semibold text-sm mb-3">Phases</p>
          <h2 className="font-display text-3xl md:text-4xl text-white leading-tight max-w-xl">
            A life in chapters &mdash; teaching, organising, and public service.
          </h2>
        </div>

        {phases.length === 0 ? (
          <p className="text-paper-100/60 text-sm">Milestones will appear here soon.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {phases.map((phase, i) => (
                <RevealOnScroll
                  key={phase.id}
                  className="h-full"
                  style={{ transitionDelay: `${Math.min(i, 4) * 75}ms` }}
                >
                  <PhaseCard phase={phase} />
                </RevealOnScroll>
              ))}
            </div>

            <div className="mt-10 flex justify-center">
              <Link
                href="/phases"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-900 bg-[var(--theme-primary)] hover:opacity-90 px-5 py-3 rounded-md transition-opacity"
              >
                View All Phases <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
