// components/DesktopHero.tsx
//
// Client wrapper for the desktop (md+) hero's text/photo pair. Needs to
// be a client component (not the server-rendered app/(site)/page.tsx
// directly) because it holds the "is the bio expanded" state that both
// ExpandableBio and the adjacent portrait react to: clicking Read More
// grows the portrait's aspect ratio in sync with the text expanding,
// and Read Less shrinks it back.

"use client";

import { useState } from "react";
import ExpandableBio from "@/components/ExpandableBio";
import CtaButtonGroup from "@/components/CtaButtonGroup";
import type { CtaButton } from "@/types/domain";

export default function DesktopHero({
  headline,
  body,
  ctas,
  themePrimary,
  heroImageUrl,
  badgeSubtitle,
  badgeTitle,
}: {
  headline: string;
  body: string;
  ctas: CtaButton[];
  themePrimary: string;
  heroImageUrl?: string | null;
  /** Empty string when the dashboard field is blank — no fallback placeholder text. */
  badgeSubtitle: string;
  badgeTitle: string;
}) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const hasBadge = Boolean(badgeSubtitle || badgeTitle);

  return (
    // Wider container (7xl, was 6xl) and a portrait column given a much
    // larger fr-share (1.35fr, was 0.9fr — ~1.5x) so the enlarged photo
    // has room without squeezing the text column. `items-start` keeps
    // the photo's top edge aligned with the headline/bio regardless of
    // which column ends up taller.
    <div className="max-w-7xl mx-auto px-5 md:px-8 pt-12 md:pt-20 pb-14 md:pb-24 grid md:grid-cols-[1fr_1.35fr] gap-12 md:gap-10 items-start">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl md:text-[3.4rem] leading-[1.08] text-navy-900">
          {headline}
        </h1>

        <ExpandableBio
          text={body}
          className="mt-6 max-w-xl"
          textClassName="text-ink-600 text-base md:text-lg leading-relaxed"
          onExpandedChange={setBioExpanded}
        />

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <CtaButtonGroup buttons={ctas} themePrimary={themePrimary} />
        </div>
      </div>

      <div className="relative w-full max-w-xl mx-auto md:max-w-none">
        <div className="absolute -inset-3 border border-[var(--theme-primary)]/60 rounded-lg hidden sm:block" />
        <div
          className={`relative w-full rounded-lg shadow-[0_18px_40px_-16px_rgba(21,31,51,0.35)] bg-navy-800 overflow-hidden flex items-center justify-center transition-[aspect-ratio] duration-300 ease-in-out ${
            bioExpanded ? "aspect-[3/4]" : "aspect-[4/5]"
          }`}
        >
          {heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heroImageUrl}
              alt="Portrait of Dipak Chatterjee"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <span className="font-display text-6xl text-paper-100/30">DC</span>
          )}
        </div>

        {hasBadge && (
          <div className="relative -mt-8 mr-6 ml-auto w-max bg-[var(--theme-secondary)] text-paper-100 px-5 py-3 rounded-md shadow-lg hidden sm:block">
            {badgeSubtitle && <p className="text-xs text-paper-100/70">{badgeSubtitle}</p>}
            {badgeTitle && <p className="font-display text-sm">{badgeTitle}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
