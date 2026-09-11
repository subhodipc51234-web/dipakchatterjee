// components/PublicLifeGallery.tsx
//
// Responsive image/video carousel for a "Public Life Gallery" (now
// "Image Gallery") feature. All slides sit side by side in a flex track;
// advancing just translates the track, so the browser compositor handles
// the motion on the GPU (transform, not layout) for a genuinely smooth
// slide instead of a crossfade. Draggable via Pointer Events, which cover
// touch and mouse alike, so it swipes natively on mobile.
//
// The container itself listens for pointerdown/move/up to drive the drag
// track — but the prev/next arrows and the dot indicators are also
// inside that same container. If a pointerdown on one of those buttons
// were allowed to reach the container handler, `setPointerCapture` would
// retarget the subsequent pointerup (and the click derived from it) to
// the container instead of the button, silently swallowing every arrow
// tap/click. `handlePointerDown` below explicitly bails out when the
// event originates from a <button>, so arrow/dot clicks always reach
// their own onClick — on desktop and on touch alike.

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FeatureMedia } from "@/types/domain";

const DEFAULT_AUTO_ADVANCE_MS = 6000;
const SLIDE_TRANSITION = "transform 650ms cubic-bezier(0.65, 0, 0.35, 1)";
const SWIPE_THRESHOLD_RATIO = 0.18;

export default function PublicLifeGallery({
  media,
  intervalMs = DEFAULT_AUTO_ADVANCE_MS,
}: {
  media: FeatureMedia[];
  intervalMs?: number;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ pointerId: number; startX: number; width: number } | null>(null);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (paused || dragging || media.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % media.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [paused, dragging, media.length, intervalMs]);

  if (media.length === 0) return null;

  function goTo(i: number) {
    setIndex(((i % media.length) + media.length) % media.length);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (media.length <= 1) return;
    if ((e.target as HTMLElement).closest("button")) return;
    const width = containerRef.current?.offsetWidth ?? 1;
    dragState.current = { pointerId: e.pointerId, startX: e.clientX, width };
    setDragging(true);
    setPaused(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || dragState.current.pointerId !== e.pointerId) return;
    setDragPx(e.clientX - dragState.current.startX);
  }

  function endDrag(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current || dragState.current.pointerId !== e.pointerId) return;
    const { startX, width } = dragState.current;
    const delta = e.clientX - startX;

    if (Math.abs(delta) > width * SWIPE_THRESHOLD_RATIO) {
      goTo(delta < 0 ? index + 1 : index - 1);
    }

    dragState.current = null;
    setDragPx(0);
    setDragging(false);
    setPaused(false);
  }

  const baseOffsetPercent = -index * 100;
  const dragOffsetPercent = containerRef.current
    ? (dragPx / containerRef.current.offsetWidth) * 100
    : 0;

  return (
    <div
      ref={containerRef}
      className="group relative w-full aspect-[16/10] md:aspect-[16/9] rounded-lg overflow-hidden bg-navy-900 select-none"
      style={{ touchAction: "pan-y" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="region"
      aria-roledescription="carousel"
      aria-label="Image gallery"
    >
      <div
        className="flex h-full will-change-transform"
        style={{
          transform: `translateX(${baseOffsetPercent + dragOffsetPercent}%)`,
          transition: dragging ? "none" : SLIDE_TRANSITION,
        }}
      >
        {media.map((item) => (
          <div key={item.id} className="relative h-full w-full shrink-0">
            {item.kind === "video" ? (
              <video
                src={item.public_url}
                controls
                controlsList="nodownload"
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.public_url}
                alt={item.title ?? item.caption ?? ""}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            )}

            {(item.title || item.caption) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-5 pt-16 pb-5 md:px-8 md:pb-6 pointer-events-none">
                {item.title && (
                  <p className="font-display text-lg md:text-xl text-white">{item.title}</p>
                )}
                {item.caption && (
                  <p className="text-sm text-white/80 mt-1 max-w-xl">{item.caption}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {media.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-900/60 hover:bg-navy-900/80 hover:scale-110 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-all duration-300 touch-manipulation"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-navy-900/60 hover:bg-navy-900/80 hover:scale-110 text-white flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 transition-all duration-300 touch-manipulation"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute top-4 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-none">
            {media.map((m, i) => (
              <button
                key={m.id}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 rounded-full transition-all duration-300 ease-out pointer-events-auto touch-manipulation ${
                  i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75 hover:w-2.5"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
