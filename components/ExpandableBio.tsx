// components/ExpandableBio.tsx
//
// "Read More / Read Less" bio paragraph for the hero section. Renders
// clamped to CLAMP_LINES (via `line-clamp-5`) for the very first paint
// (server-rendered, before hydration) so there's no flash of the full
// text — then, once mounted, measures the paragraph's real line-height
// and full scrollHeight and switches to controlling an explicit
// `max-height` on the wrapping div instead. That's what actually makes
// the expand/collapse animate smoothly: `-webkit-line-clamp` itself
// can't be transitioned, but `max-height` can, and clipping the same
// unclamped text with an animating max-height looks identical at rest
// while allowing a smooth reveal/collapse in between.

"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const CLAMP_LINES = 5;

export default function ExpandableBio({
  text,
  className = "",
  textClassName = "text-ink-600 text-base leading-relaxed",
  fadeFromClassName = "from-paper-100",
  onExpandedChange,
}: {
  text: string;
  className?: string;
  textClassName?: string;
  /** Gradient start color, matching whatever surface this sits on — see from-{color} in the bg-gradient-to-t fade. */
  fadeFromClassName?: string;
  /** Notifies a parent (e.g. the hero's adjacent portrait) so it can animate in sync with Read More/Read Less. */
  onExpandedChange?: (expanded: boolean) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [heights, setHeights] = useState<{ collapsed: number; full: number } | null>(null);

  useLayoutEffect(() => {
    const el = paragraphRef.current;
    if (!el) return;

    function measure() {
      if (!el) return;
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
      const collapsed = (Number.isFinite(lineHeight) ? lineHeight : el.clientHeight) * CLAMP_LINES;
      // Momentarily lift the clamp to measure the paragraph's true
      // unclamped height, then restore whatever clamp state was active.
      const hadClampClass = el.classList.contains("line-clamp-5");
      el.classList.remove("line-clamp-5");
      const full = el.scrollHeight;
      if (hadClampClass) el.classList.add("line-clamp-5");
      setHeights({ collapsed, full });
    }

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  const overflows = heights ? heights.full > heights.collapsed + 1 : false;

  function handleToggle() {
    if (expanded) {
      // Collapsing: if the reader scrolled down while the full bio was
      // open, keep the card in view instead of letting the page jump
      // once the text snaps back to five lines. `block: "nearest"`
      // means this only scrolls when needed — it's a no-op if the card
      // is already comfortably in view.
      wrapperRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    setExpanded((v) => {
      onExpandedChange?.(!v);
      return !v;
    });
  }

  return (
    <div ref={wrapperRef} className={className}>
      <div
        className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={heights ? { maxHeight: expanded ? heights.full : heights.collapsed } : undefined}
      >
        <p ref={paragraphRef} className={`${textClassName} ${heights ? "" : "line-clamp-5"}`}>
          {text}
        </p>

        {overflows && !expanded && (
          <div
            aria-hidden="true"
            className={`absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t ${fadeFromClassName} to-transparent pointer-events-none`}
          />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[var(--theme-primary)] hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)] focus-visible:ring-offset-2 rounded"
        >
          {expanded ? "Read Less" : "Read More"}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
