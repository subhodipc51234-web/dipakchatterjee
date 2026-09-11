// components/CtaButtonGroup.tsx
//
// Renders the admin-managed CTA button list. Each button falls back to
// the site's Main Theme Color when it has no explicit override, and picks
// readable (dark vs. white) text automatically based on how light the
// resolved color is.

import { isLightColor } from "@/lib/color";
import AnchorAwareLink from "@/components/site/AnchorAwareLink";
import type { CtaButton } from "@/types/domain";

export default function CtaButtonGroup({
  buttons,
  themePrimary,
}: {
  buttons: CtaButton[];
  themePrimary: string;
}) {
  if (buttons.length === 0) return null;

  return (
    <>
      {buttons.map((btn) => {
        const color = btn.color || themePrimary;
        const textColor = isLightColor(color) ? "#151F33" : "#FFFFFF";
        return (
          <AnchorAwareLink
            key={btn.id}
            href={btn.url}
            style={{ backgroundColor: color, color: textColor }}
            className="relative z-10 inline-flex items-center gap-2 font-semibold px-6 py-3.5 rounded-md transition-[filter] hover:brightness-90 touch-manipulation"
          >
            {btn.label}
          </AnchorAwareLink>
        );
      })}
    </>
  );
}
